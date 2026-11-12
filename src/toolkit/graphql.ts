import fs from 'node:fs';
import path from 'node:path';
import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  Kind,
  NoUnusedFragmentsRule,
  parse,
  printSchema,
  specifiedRules,
  validate,
  visit,
  type DefinitionNode,
  type DocumentNode,
  type FragmentDefinitionNode,
  type GraphQLSchema,
  type IntrospectionQuery,
  type OperationDefinitionNode,
  type SelectionSetNode,
} from 'graphql';
import { toolkitConfig, type ToolkitConfig } from '../../toolkit.config';
import { resolveEndpoint } from './sitecore-endpoint';
import { fromRoot, relativeToRoot, walkFiles } from './paths';
import type { CheckGroup, CheckResult } from './types';

export interface OperationInfo {
  name?: string;
  type: 'query' | 'mutation' | 'subscription';
  depth: number;
  variables: string[];
}

export interface GraphQLFileInfo {
  file: string;
  operations: OperationInfo[];
  fragments: string[];
  fragmentSpreads: string[];
  error?: string;
  document?: DocumentNode;
}

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

export function loadGraphQLFiles(config: ToolkitConfig = toolkitConfig): GraphQLFileInfo[] {
  const schemaFile = path.resolve(fromRoot(config.graphql.schemaFile));
  const files = walkFiles(fromRoot(config.graphql.dir), (f) => /\.(graphql|gql)$/.test(f)).filter(
    (f) => path.resolve(f) !== schemaFile,
  );

  const parsed = files.map<GraphQLFileInfo>((file) => {
    const rel = relativeToRoot(file);
    try {
      const document = parse(fs.readFileSync(file, 'utf8'));
      const spreads = new Set<string>();
      collectSpreads(document, spreads);
      return {
        file: rel,
        document,
        operations: [],
        fragments: document.definitions.filter(isFragment).map((f) => f.name.value),
        fragmentSpreads: [...spreads],
      };
    } catch (error) {
      return { file: rel, operations: [], fragments: [], fragmentSpreads: [], error: (error as Error).message };
    }
  });

  const fragmentMap = new Map<string, FragmentDefinitionNode>();
  for (const info of parsed) {
    for (const def of info.document?.definitions ?? []) if (isFragment(def)) fragmentMap.set(def.name.value, def);
  }

  for (const info of parsed) {
    info.operations = (info.document?.definitions ?? []).filter(isOperation).map((op) => ({
      name: op.name?.value,
      type: op.operation as OperationInfo['type'],
      depth: selectionDepth(op.selectionSet, fragmentMap, new Set()),
      variables: (op.variableDefinitions ?? []).map((v) => v.variable.name.value),
    }));
  }

  return parsed;
}

export function loadSchema(config: ToolkitConfig = toolkitConfig): GraphQLSchema | undefined {
  const file = fromRoot(config.graphql.schemaFile);
  if (!fs.existsSync(file)) return undefined;
  return buildSchema(fs.readFileSync(file, 'utf8'));
}

export function validateGraphQL(config: ToolkitConfig = toolkitConfig): CheckGroup {
  const files = loadGraphQLFiles(config);
  const results: CheckResult[] = [];

  if (files.length === 0) {
    results.push({
      id: 'none',
      title: 'GraphQL documents',
      status: 'skip',
      message: `No .graphql files found in ${config.graphql.dir}.`,
    });
    return { id: 'graphql', title: 'GraphQL', results };
  }

  // 1. Syntax
  const syntaxErrors = files.filter((f) => f.error);
  results.push({
    id: 'syntax',
    title: 'Syntax',
    status: syntaxErrors.length ? 'fail' : 'pass',
    message: syntaxErrors.length
      ? `${syntaxErrors.length} file(s) failed to parse`
      : `${files.length} document(s) parsed`,
    details: syntaxErrors.map((f) => `${f.file}: ${f.error}`),
  });

  const operations = files.flatMap((f) => f.operations.map((op) => ({ ...op, file: f.file })));

  // 2. Naming: named, PascalCase, matching the file name when the file holds a single operation
  const naming: string[] = [];
  for (const file of files) {
    for (const op of file.operations) {
      if (!op.name) naming.push(`${file.file}: anonymous ${op.type}. Name every operation.`);
      else if (!PASCAL_CASE.test(op.name)) naming.push(`${file.file}: "${op.name}" should be PascalCase.`);
    }
    if (file.operations.length === 1 && file.operations[0].name) {
      const expected = path
        .basename(file.file)
        .replace(/\.(graphql|gql)$/, '')
        .split(/[-_.]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
      if (expected !== file.operations[0].name) {
        naming.push(
          `${file.file}: operation "${file.operations[0].name}" does not match file name (expected ${expected}).`,
        );
      }
    }
  }
  results.push({
    id: 'naming',
    title: 'Operation naming',
    status: naming.length ? 'warn' : 'pass',
    message: naming.length
      ? `${naming.length} naming issue(s)`
      : `${operations.length} operation(s) follow the convention`,
    details: naming,
  });

  // 3. Duplicates (codegen and caching both break on duplicate names)
  const duplicates = findDuplicates([
    ...operations.filter((o) => o.name).map((o) => ({ key: `operation ${o.name}`, file: o.file })),
    ...files.flatMap((f) => f.fragments.map((name) => ({ key: `fragment ${name}`, file: f.file }))),
  ]);
  results.push({
    id: 'duplicates',
    title: 'Unique names',
    status: duplicates.length ? 'fail' : 'pass',
    message: duplicates.length ? 'Duplicate operation or fragment names' : 'No duplicates',
    details: duplicates,
  });

  // 4. Unused and unknown fragments
  const defined = new Set(files.flatMap((f) => f.fragments));
  const used = new Set(files.flatMap((f) => f.fragmentSpreads));
  const unused = [...defined].filter((name) => !used.has(name));
  const unknown = [...used].filter((name) => !defined.has(name));
  results.push({
    id: 'fragments',
    title: 'Fragment usage',
    status: unknown.length ? 'fail' : unused.length ? 'warn' : 'pass',
    message: unknown.length
      ? 'Some spreads reference fragments that do not exist.'
      : unused.length
        ? 'Some fragments are never used.'
        : `${defined.size} fragment(s), all used`,
    details: [...unknown.map((n) => `unknown: ${n}`), ...unused.map((n) => `unused: ${n}`)],
  });

  // 5. Complexity
  const tooDeep = operations.filter((o) => o.depth > config.graphql.maxDepth);
  results.push({
    id: 'depth',
    title: `Query depth (max ${config.graphql.maxDepth})`,
    status: tooDeep.length ? 'warn' : 'pass',
    message: tooDeep.length
      ? 'Deep queries are slow on Experience Edge and hit complexity limits.'
      : `Deepest operation: ${Math.max(0, ...operations.map((o) => o.depth))}`,
    details: tooDeep.map((o) => `${o.name ?? 'anonymous'} (${o.file}): depth ${o.depth}`),
  });

  // 6. Validation against the schema
  let schema: GraphQLSchema | undefined;
  try {
    schema = loadSchema(config);
  } catch (error) {
    results.push({
      id: 'schema',
      title: 'Schema validation',
      status: 'fail',
      message: `Could not load ${config.graphql.schemaFile}: ${(error as Error).message}`,
    });
    return { id: 'graphql', title: 'GraphQL', results };
  }

  if (!schema) {
    results.push({
      id: 'schema',
      title: 'Schema validation',
      status: 'skip',
      message: `${config.graphql.schemaFile} not found. Run \`npm run sc:graphql:schema\` to enable it.`,
    });
  } else {
    const fragmentDefs = files.flatMap((f) => (f.document?.definitions ?? []).filter(isFragment));
    const rules = specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule);
    const errors: string[] = [];
    for (const file of files) {
      if (!file.document) continue;
      const ops = file.document.definitions.filter(isOperation);
      if (ops.length === 0) continue;
      const uniqueFragments = [...new Map(fragmentDefs.map((d) => [d.name.value, d])).values()];
      const document: DocumentNode = { kind: Kind.DOCUMENT, definitions: [...ops, ...uniqueFragments] };
      for (const error of validate(schema, document, rules)) errors.push(`${file.file}: ${error.message}`);
    }
    results.push({
      id: 'schema',
      title: 'Schema validation',
      status: errors.length ? 'fail' : 'pass',
      message: errors.length ? `${errors.length} validation error(s)` : 'All operations are valid against the schema',
      details: errors,
    });
  }

  return { id: 'graphql', title: 'GraphQL', results };
}

/** Downloads the Experience Edge schema via introspection and saves it as SDL. */
export async function downloadSchema(
  env: Record<string, string | undefined> = process.env,
  config: ToolkitConfig = toolkitConfig,
): Promise<{ file: string; types: number }> {
  const endpoint = resolveEndpoint(env, config);
  if (!endpoint) {
    throw new Error(
      'No Sitecore connection configured. Set SITECORE_EDGE_CONTEXT_ID or SITECORE_API_HOST + SITECORE_API_KEY.',
    );
  }

  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...endpoint.headers },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
    signal: AbortSignal.timeout(config.content.timeoutMs * 2),
  });
  if (!response.ok) throw new Error(`Introspection failed: HTTP ${response.status} ${response.statusText}`);

  const json = (await response.json()) as { data?: IntrospectionQuery; errors?: { message: string }[] };
  if (!json.data) {
    throw new Error(`Introspection failed: ${json.errors?.map((e) => e.message).join('; ') ?? 'no data returned'}`);
  }

  const schema = buildClientSchema(json.data);
  const file = fromRoot(config.graphql.schemaFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${printSchema(schema)}\n`);
  return { file: relativeToRoot(file), types: Object.keys(schema.getTypeMap()).length };
}

// ---------------------------------------------------------------------------

function isOperation(def: DefinitionNode): def is OperationDefinitionNode {
  return def.kind === Kind.OPERATION_DEFINITION;
}

function isFragment(def: DefinitionNode): def is FragmentDefinitionNode {
  return def.kind === Kind.FRAGMENT_DEFINITION;
}

function collectSpreads(document: DocumentNode, into: Set<string>): void {
  visit(document, {
    FragmentSpread(node) {
      into.add(node.name.value);
    },
  });
}

function selectionDepth(
  selectionSet: SelectionSetNode | undefined,
  fragments: Map<string, FragmentDefinitionNode>,
  visiting: Set<string>,
): number {
  if (!selectionSet) return 0;
  let max = 0;
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      max = Math.max(max, selection.selectionSet ? 1 + selectionDepth(selection.selectionSet, fragments, visiting) : 1);
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      max = Math.max(max, selectionDepth(selection.selectionSet, fragments, visiting));
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const name = selection.name.value;
      const fragment = fragments.get(name);
      if (fragment && !visiting.has(name)) {
        visiting.add(name);
        max = Math.max(max, selectionDepth(fragment.selectionSet, fragments, visiting));
        visiting.delete(name);
      }
    }
  }
  return max;
}

function findDuplicates(items: { key: string; file: string }[]): string[] {
  const seen = new Map<string, string[]>();
  for (const item of items) seen.set(item.key, [...(seen.get(item.key) ?? []), item.file]);
  return [...seen.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([key, files]) => `${key}: ${files.join(', ')}`);
}
