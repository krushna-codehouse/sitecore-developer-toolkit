/**
 * Central configuration for the developer toolkit.
 *
 * Every script, the CLI and the dashboard read from this file, so a team can
 * adapt the toolkit to its own project conventions in one place.
 *
 * NOTE: environment variable names differ between Content SDK versions and
 * hosting setups. Adjust `env` to match the variables your app actually reads.
 */

export interface EnvVarRule {
  name: string;
  description: string;
  /** Optional format check applied when the variable is set. */
  pattern?: RegExp;
  patternHint?: string;
}

export interface ToolkitConfig {
  /** Folder that contains one sub-folder per component. */
  componentsDir: string;
  /** Generated registry of rendering name -> React component. */
  componentMapFile: string;
  /** Scaffolding templates. `__name__` in a file name is replaced by the component name. */
  templatesDir: string;
  node: { minMajor: number };
  env: {
    required: EnvVarRule[];
    /** At least one option (a list of variables that must all be set) has to be satisfied. */
    anyOf: { title: string; options: string[][] }[];
    recommended: EnvVarRule[];
    /** Variables that must be valid absolute URLs when set. */
    urlVars: string[];
  };
  components: {
    /** File patterns every component folder must contain. `{name}` = component name. */
    requiredFiles: string[];
    /** File patterns that produce a warning when missing. */
    recommendedFiles: string[];
  };
  graphql: {
    dir: string;
    /** Local SDL copy of the Experience Edge schema (download with `npm run sc:graphql:schema`). */
    schemaFile: string;
    /** Maximum selection depth before a query is flagged as too complex. */
    maxDepth: number;
  };
  content: {
    defaultEdgeUrl: string;
    /** Routes inspected by `sc:content:check` when no --path is given. */
    paths: string[];
    timeoutMs: number;
  };
}

export const toolkitConfig: ToolkitConfig = {
  componentsDir: 'src/components',
  componentMapFile: 'src/components/component-map.ts',
  templatesDir: 'templates/component',

  node: { minMajor: 20 },

  env: {
    required: [
      {
        name: 'NEXT_PUBLIC_DEFAULT_SITE_NAME',
        description: 'Sitecore site name used to resolve layout and dictionary data.',
      },
      {
        name: 'NEXT_PUBLIC_DEFAULT_LANGUAGE',
        description: 'Default content language.',
        pattern: /^[a-z]{2}(-[A-Za-z]{2,4})?$/,
        patternHint: 'Use a language code such as "en" or "en-AU".',
      },
    ],
    anyOf: [
      {
        title: 'Sitecore connection',
        options: [['SITECORE_EDGE_CONTEXT_ID'], ['SITECORE_API_HOST', 'SITECORE_API_KEY']],
      },
    ],
    recommended: [
      {
        name: 'SITECORE_EDITING_SECRET',
        description: 'Required for the editing host (Pages / Experience Editor) to call the app.',
      },
    ],
    urlVars: ['SITECORE_EDGE_URL', 'SITECORE_API_HOST'],
  },

  components: {
    requiredFiles: ['{name}.tsx', '{name}.types.ts', '{name}.test.tsx', 'index.ts'],
    recommendedFiles: ['{name}.module.css', '{name}.mock.ts'],
  },

  graphql: {
    dir: 'src/graphql',
    schemaFile: 'src/graphql/schema.graphql',
    maxDepth: 8,
  },

  content: {
    defaultEdgeUrl: 'https://edge-platform.sitecorecloud.io',
    paths: ['/'],
    timeoutMs: 15000,
  },
};

export default toolkitConfig;
