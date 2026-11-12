/**
 * @jest-environment node
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createComponent, checkComponents, renderTemplate, templateTokens, validateComponentPath } from '../components';
import { checkEnvironment } from '../env';
import { validateGraphQL } from '../graphql';

const TEMPLATES = path.join(process.cwd(), 'templates', 'component');
let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-toolkit-'));
  process.env.TOOLKIT_ROOT = root;
});

afterEach(() => {
  delete process.env.TOOLKIT_ROOT;
  fs.rmSync(root, { recursive: true, force: true });
});

const write = (rel: string, content: string) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const find = (group: ReturnType<typeof validateGraphQL>, id: string) => group.results.find((r) => r.id === id);

describe('component names', () => {
  it.each([
    ['HeroBanner', undefined],
    ['marketing/HeroBanner', undefined],
    ['heroBanner', 'PascalCase'],
    ['Marketing/HeroBanner', 'kebab-case'],
    ['', 'required'],
  ])('%s', (input, expected) => {
    const error = validateComponentPath(input);
    if (expected) expect(error).toContain(expected);
    else expect(error).toBeUndefined();
  });

  it('derives template tokens', () => {
    expect(templateTokens('HTMLTeaserCard')).toEqual({
      name: 'HTMLTeaserCard',
      camelName: 'hTMLTeaserCard',
      kebabName: 'html-teaser-card',
      titleName: 'HTML Teaser Card',
    });
  });

  it('only replaces known tokens', () => {
    expect(renderTemplate('{{name}} style={{ a: 1 }} {{unknown}}', { name: 'X' })).toBe(
      'X style={{ a: 1 }} {{unknown}}',
    );
  });
});

describe('createComponent + checkComponents', () => {
  it('scaffolds files, registers the component and passes diagnostics', () => {
    const result = createComponent('marketing/PromoTile', { templatesDir: TEMPLATES });
    expect(result.files).toEqual(
      expect.arrayContaining([
        'src/components/marketing/PromoTile/PromoTile.tsx',
        'src/components/marketing/PromoTile/PromoTile.test.tsx',
        'src/components/marketing/PromoTile/index.ts',
      ]),
    );
    expect(fs.readFileSync(path.join(root, 'src/components/component-map.ts'), 'utf8')).toContain(
      "['PromoTile', PromoTile]",
    );
    expect(checkComponents().results.every((r) => r.status === 'pass')).toBe(true);
  });

  it('refuses duplicate rendering names in other folders', () => {
    createComponent('HeroBanner', { templatesDir: TEMPLATES });
    expect(() => createComponent('campaign/HeroBanner', { templatesDir: TEMPLATES })).toThrow(/already exists/);
  });

  it('does not write anything on a dry run', () => {
    createComponent('DryRun', { templatesDir: TEMPLATES, dryRun: true });
    expect(fs.existsSync(path.join(root, 'src/components/DryRun'))).toBe(false);
  });

  it('flags missing files, raw field values and unregistered components', () => {
    write(
      'src/components/Broken/Broken.tsx',
      'export default function Broken({ fields }: any) { return <h2>{fields.heading.value}</h2>; }',
    );
    write('src/components/component-map.ts', "export const componentMap = new Map([\n  ['Ghost', Ghost],\n]);");

    const group = checkComponents();
    const broken = group.results.find((r) => r.id === 'component-Broken');
    expect(broken?.status).toBe('fail');
    expect(broken?.message).toMatch(/Missing Broken.types.ts/);
    expect(broken?.message).toMatch(/Use <Text>/);
    expect(broken?.message).toMatch(/Not registered/);
    expect(group.results.find((r) => r.id === 'map-stale')?.details).toEqual(['Ghost']);
  });
});

describe('validateGraphQL', () => {
  it('passes for well-formed documents', () => {
    write('src/graphql/queries/get-page.graphql', 'query GetPage($p: String!) { item(path: $p) { ...F } }');
    write('src/graphql/fragments/f.graphql', 'fragment F on Item { id }');
    const group = validateGraphQL();
    expect(find(group, 'syntax')?.status).toBe('pass');
    expect(find(group, 'naming')?.status).toBe('pass');
    expect(find(group, 'fragments')?.status).toBe('pass');
    expect(find(group, 'schema')?.status).toBe('skip');
  });

  it('reports syntax errors, anonymous operations, duplicates and unused fragments', () => {
    write('src/graphql/a.graphql', 'query { item { id }');
    write('src/graphql/b.graphql', '{ item { id } }');
    write('src/graphql/get-x.graphql', 'query GetX { a }');
    write('src/graphql/get-x-copy.graphql', 'query GetX { b }');
    write('src/graphql/unused.graphql', 'fragment Unused on Item { id }');
    const group = validateGraphQL();
    expect(find(group, 'syntax')?.status).toBe('fail');
    expect(find(group, 'naming')?.details?.join()).toMatch(/anonymous/);
    expect(find(group, 'duplicates')?.status).toBe('fail');
    expect(find(group, 'fragments')?.details).toEqual(['unused: Unused']);
  });

  it('validates operations against a local schema', () => {
    write('src/graphql/schema.graphql', 'type Query { item(path: String!): Item } type Item { id: ID! name: String }');
    write('src/graphql/get-item.graphql', 'query GetItem { item(path: "/") { id missingField } }');
    const schema = find(validateGraphQL(), 'schema');
    expect(schema?.status).toBe('fail');
    expect(schema?.details?.[0]).toMatch(/missingField/);
  });

  it('flags queries deeper than the configured maximum', () => {
    write('src/graphql/get-deep.graphql', 'query GetDeep { a { b { c { d { e { f { g { h { i { j } } } } } } } } } }');
    expect(find(validateGraphQL(), 'depth')?.status).toBe('warn');
  });
});

describe('checkEnvironment', () => {
  const status = (env: Record<string, string>, id: string) =>
    checkEnvironment(env).results.find((r) => r.id === id)?.status;

  it('passes with a complete Edge configuration', () => {
    const env = {
      NEXT_PUBLIC_DEFAULT_SITE_NAME: 'corporate',
      NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
      SITECORE_EDGE_CONTEXT_ID: 'abc123',
      SITECORE_EDITING_SECRET: 's3cret',
    };
    const failing = checkEnvironment(env).results.filter((r) => r.status === 'fail' && r.id !== 'node-version');
    expect(failing).toEqual([]);
  });

  it('fails when required or connection variables are missing', () => {
    expect(status({}, 'env-NEXT_PUBLIC_DEFAULT_SITE_NAME')).toBe('fail');
    expect(status({}, 'env-anyof-Sitecore connection')).toBe('fail');
    expect(
      status({ SITECORE_API_HOST: 'https://cm.localhost', SITECORE_API_KEY: 'k' }, 'env-anyof-Sitecore connection'),
    ).toBe('pass');
  });

  it('detects bad formats, placeholders and leaked secrets', () => {
    expect(status({ NEXT_PUBLIC_DEFAULT_LANGUAGE: 'English' }, 'env-NEXT_PUBLIC_DEFAULT_LANGUAGE')).toBe('fail');
    expect(status({ SITECORE_EDGE_CONTEXT_ID: 'your-context-id' }, 'env-placeholders')).toBe('fail');
    expect(status({ NEXT_PUBLIC_EDITING_SECRET: 'x' }, 'env-public-secrets')).toBe('fail');
    expect(status({ NEXT_PUBLIC_SITECORE_API_KEY: 'x' }, 'env-public-secrets')).toBe('warn');
    expect(status({ SITECORE_API_HOST: 'not a url' }, 'env-url-SITECORE_API_HOST')).toBe('fail');
  });
});
