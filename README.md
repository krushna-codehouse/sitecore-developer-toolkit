# Sitecore Developer Toolkit

A developer productivity toolkit for Sitecore Content SDK (Next.js) projects. It brings scaffolding, diagnostics, GraphQL validation, quality gates and AI-assistant rules together behind one CLI and a small web dashboard.

```
npm run sc:component:create -- HeroBanner   # scaffold + register a component
npm run sc:project:health                   # run every check
npm run dev                                 # dashboard at http://localhost:3000
```

## Getting started

```bash
nvm use                  # Node 22 (see .nvmrc)
npm install              # also installs the Git hooks (husky)
cp .env.example .env.local
npm run sc:env:check     # tells you what is still missing
npm run dev              # runs the env check, then starts Next.js
```

Use `npm run dev:no-check` to open the dashboard before you have Sitecore credentials.

## What is included

| Area                  | Where                                                                         | Command                                             |
| --------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Environment checks    | `src/toolkit/env.ts`                                                          | `sc:env:check`                                      |
| Component scaffolder  | `templates/component/*.tpl`, `src/toolkit/components.ts`                      | `sc:component:create -- [folder/]Name [--dry-run]`  |
| Component map         | `src/components/component-map.ts` (generated)                                 | `sc:component:map`                                  |
| Component diagnostics | `src/toolkit/components.ts`                                                   | `sc:component:check`                                |
| GraphQL validation    | `src/toolkit/graphql.ts`, `src/graphql/**`                                    | `sc:graphql:validate`                               |
| GraphQL types         | `codegen.ts`                                                                  | `sc:graphql:schema` then `codegen`                  |
| Live content check    | `src/toolkit/content.ts`                                                      | `sc:content:check -- --path / --path /about`        |
| Project health        | `src/toolkit/health.ts` → `reports/health.json`                               | `sc:project:health [--content] [--strict] [--json]` |
| One-shot validation   | `scripts/cli.ts`                                                              | `sc:validate [--keep-going]`                        |
| Git hooks             | `.husky/pre-commit` (lint-staged), `.husky/pre-push`                          | automatic                                           |
| CI quality gate       | `.github/workflows/quality.yml`                                               | automatic on PR                                     |
| AI instructions       | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md` | n/a                                                 |
| Dashboard             | `src/app` (`/`, `/components`, `/graphql`)                                    | `npm run dev`                                       |

Run `npm run sc -- help` to list every CLI command.

### Checks in detail

**Environment**: Node version and `.nvmrc`, required variables and their format, an Edge context ID _or_ a local API host and key, recommended variables, URL format, values left over from `.env.example`, and secret-looking `NEXT_PUBLIC_*` variables that would end up in the browser bundle. Variable values are never printed.

**Components**: required and recommended files, default export, unique rendering names, registration in the component map, stale map entries, raw `fields.x.value` rendering (breaks inline editing) and a missing guard for an empty datasource.

**GraphQL**: syntax, named PascalCase operations matching their file name, duplicate operation and fragment names, unused and unknown fragments, query depth and, once `src/graphql/schema.graphql` exists, full validation against the Experience Edge schema.

**Content** (network): connects to Experience Edge or a local CM, resolves the site, loads the layout of each route and lists renderings that have **no registered React component**, which is the usual reason a component silently disappears from a page.

## Using it in a real Content SDK app

1. Copy `scripts/`, `src/toolkit/`, `templates/`, `toolkit.config.ts` and the AI and CI files into your app, and add the `sc:*` scripts and dev dependencies from `package.json`.
2. Replace the contents of `src/lib/sitecore.tsx` with `export * from '@sitecore-content-sdk/nextjs';`. Generated components then use the real SDK field components without any other change.
3. Edit `toolkit.config.ts`: environment variable names for your SDK version, the components folder and the component map file.
4. If your app already generates a component map with `sitecore-tools` (Content SDK CLI), point `componentMapFile` at it and stop using `sc:component:map`, so there is one source of truth.

This toolkit extends the official `sitecore-tools` CLI rather than replacing it. Use `sitecore-tools project component scaffold` when you want the stock templates, and `sc:component:create` when you want your team's full folder (types, mock, tests, styles, registration).

## Customising

- **Templates**: add or edit files in `templates/component/`. `__name__` in a file name becomes the component name. Available tokens are `{{name}}`, `{{camelName}}`, `{{kebabName}}` and `{{titleName}}`.
- **Rules**: change required files, the GraphQL depth limit, content routes and environment rules in `toolkit.config.ts`.
- **New commands**: add an entry to the `commands` object in `scripts/cli.ts` and a matching `sc:*` script in `package.json`. Commands only start fixed npm scripts and never pass user input to a shell.

## Project structure

```
scripts/            CLI entry point and terminal output
src/toolkit/        check engine shared by the CLI and the dashboard (+ tests)
src/app/            Next.js dashboard
src/components/     Sitecore components and the generated component map
src/graphql/        queries, fragments, schema (downloaded) and generated types
src/lib/sitecore.tsx  Sitecore field adapter (swap for the SDK)
templates/component scaffolding templates
toolkit.config.ts   conventions and rules
```
