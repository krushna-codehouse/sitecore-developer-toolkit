import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates TypeScript types for every operation in src/graphql.
 * Download the schema first with `npm run sc:graphql:schema`.
 */
const config: CodegenConfig = {
  schema: 'src/graphql/schema.graphql',
  documents: ['src/graphql/**/*.graphql', '!src/graphql/schema.graphql'],
  ignoreNoDocuments: true,
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        avoidOptionals: false,
        enumsAsTypes: true,
        scalars: { JSON: 'unknown' },
      },
    },
  },
};

export default config;
