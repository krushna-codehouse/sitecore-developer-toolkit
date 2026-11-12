import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/templates/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.mock.ts',
    '!src/**/*.types.ts',
    '!src/**/index.ts',
    '!src/app/**',
    '!src/graphql/generated/**',
    '!src/components/component-map.ts',
  ],
  coverageThreshold: {
    global: { statements: 60, branches: 50, functions: 60, lines: 60 },
  },
};

export default createJestConfig(config);
