# Sitecore Developer Toolkit

A developer productivity toolkit for **Sitecore Content SDK (Next.js)** projects.

It brings together the everyday jobs of a Sitecore front-end team (environment checks, component scaffolding, component diagnostics, GraphQL validation, quality gates, CI and AI-assistant rules) behind **one CLI** and a small **web dashboard**.

```bash
npm run sc:component:create -- HeroBanner   # scaffold + register a component
npm run sc:project:health                   # run every check
npm run dev                                 # dashboard at http://localhost:3000
```

---

## Contents

1. [Why this toolkit](#1-why-this-toolkit)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Configure your environment](#4-configure-your-environment)
5. [Run the dashboard](#5-run-the-dashboard)
6. [Daily workflow: creating a component end to end](#6-daily-workflow-creating-a-component-end-to-end)
7. [Command reference](#7-command-reference)
8. [Working with GraphQL](#8-working-with-graphql)
9. [Diagnosing missing components on a page](#9-diagnosing-missing-components-on-a-page)
10. [Git hooks](#10-git-hooks)
11. [CI/CD quality gate (GitHub Actions)](#11-cicd-quality-gate-github-actions)
12. [AI-assisted development](#12-ai-assisted-development)
13. [Adding the toolkit to an existing Content SDK project](#13-adding-the-toolkit-to-an-existing-content-sdk-project)
14. [Customising the toolkit](#14-customising-the-toolkit)
15. [Project structure](#15-project-structure)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Why this toolkit

Every new component in a Sitecore project means the same steps: create a folder, a component, prop types, Sitecore field handling, registration, a test and styles, then lint, test and check editing mode. Every developer also needs the right Node version and environment variables.

This toolkit automates those steps and checks so that every developer and every pull request follows the same conventions:

| Problem                                               | Toolkit answer                                            |
| ----------------------------------------------------- | --------------------------------------------------------- |
| "It works on my machine" environment differences      | `sc:env:check` runs before `npm run dev`                  |
| Inconsistent component structure                      | `sc:component:create` scaffolds from templates            |
| Component added in Sitecore but not shown on the page | `sc:content:check` compares layout with the component map |
| Duplicate, unused or invalid GraphQL queries          | `sc:graphql:validate` + GraphQL Code Generator            |
| Remembering many commands                             | One `sc` CLI and `sc:validate`                            |
| Problems reaching `main`                              | Git hooks + GitHub Actions quality gate                   |
| AI assistants generating non-Sitecore React           | `AGENTS.md`, Cursor rules, Copilot instructions           |

It **extends** the official Sitecore `sitecore-tools` CLI rather than replacing it (see [section 13](#13-adding-the-toolkit-to-an-existing-content-sdk-project)).

---

## 2. Prerequisites

| Requirement | Version / notes                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js     | 20.9 or later. **22 recommended** (pinned in `.nvmrc`).                                                                                                                     |
| npm         | 10 or later                                                                                                                                                                 |
| Git         | Any recent version (required for the Git hooks)                                                                                                                             |
| Sitecore    | Optional for most features. Needed only for `sc:content:check` and `sc:graphql:schema`: an XM Cloud / SitecoreAI **Edge context ID**, or a local CM **API host + API key**. |

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## 3. Installation

```bash
# 1. Clone
git clone https://github.com/krushna-codehouse/sitecore-developer-toolkit.git
cd sitecore-developer-toolkit

# 2. Use the pinned Node version (nvm / nvm-windows / fnm)
nvm use            # or: nvm install 22 && nvm use 22

# 3. Install dependencies (this also installs the Git hooks via husky)
npm install

# 4. Confirm everything works
npm test
npm run sc -- help
```

> **Windows users:** `.gitattributes` forces LF line endings, which Prettier and the Git hooks require, even when `core.autocrlf` is `true`.

---

## 4. Configure your environment

### Step 1: create `.env.local`

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

### Step 2: fill in the values

| Variable                        | Required    | Description                                                |
| ------------------------------- | ----------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_DEFAULT_SITE_NAME` | Yes         | Sitecore site name, e.g. `corporate`                       |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE`  | Yes         | Default language, e.g. `en` or `en-AU`                     |
| `SITECORE_EDGE_CONTEXT_ID`      | Option A    | Experience Edge context ID (XM Cloud / SitecoreAI)         |
| `SITECORE_EDGE_URL`             | No          | Defaults to `https://edge-platform.sitecorecloud.io`       |
| `SITECORE_API_HOST`             | Option B    | Local / self-hosted CM, e.g. `https://xmcloudcm.localhost` |
| `SITECORE_API_KEY`              | Option B    | Sitecore API key for the local CM                          |
| `SITECORE_EDITING_SECRET`       | Recommended | Secret used by the editing host (Pages)                    |

You need **either** option A (Edge) **or** option B (local CM).

> Variable names differ between Content SDK versions. If your app uses different names, change them in `toolkit.config.ts` → `env`.

### Step 3: validate

```bash
npm run sc:env:check
```

Example output:

```
✖ Environment
  ✔ Node.js version — Node 22.11.0
  ✔ Matches .nvmrc — .nvmrc pins Node 22
  ✔ NEXT_PUBLIC_DEFAULT_SITE_NAME — Set
  ✖ NEXT_PUBLIC_DEFAULT_LANGUAGE — Invalid format. Use a language code such as "en" or "en-AU".
  ✔ Sitecore connection — Using SITECORE_EDGE_CONTEXT_ID
  ⚠ SITECORE_EDITING_SECRET — Not set. Required for the editing host ...
  ✔ No placeholder values — No example values detected
  ✔ No secrets in NEXT_PUBLIC_ variables — No secret-looking public variables
```

The check never prints variable values, so its output is safe to share or publish from CI.

---

## 5. Run the dashboard

```bash
npm run dev            # runs sc:env:check first, then starts Next.js
npm run dev:no-check   # start without the environment check (no Sitecore credentials yet)
```

Open <http://localhost:3000>.

| Page          | What it shows                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `/`           | Health score and results for the environment, component and GraphQL checks, plus a command reference |
| `/?content=1` | The same page, plus the **live Sitecore content check**                                              |
| `/components` | File matrix for every component, diagnostics, and a **Create component** form (dev mode only)        |
| `/graphql`    | Every operation (type, variables, depth), fragments and validation results                           |

Production build:

```bash
npm run build
npm start
```

> In production mode the dashboard is read-only; the create-component form is disabled.

---

## 6. Daily workflow: creating a component end to end

### Step 1: generate

```bash
npm run sc:component:create -- HeroBanner

# inside a category folder (folders are kebab-case, the name is PascalCase)
npm run sc:component:create -- marketing/PromoCard

# preview the files without writing anything
npm run sc:component:create -- HeroBanner --dry-run
```

This creates:

```
src/components/HeroBanner/
├── HeroBanner.tsx          # component (uses Sitecore field components)
├── HeroBanner.types.ts     # Fields, Params and Props interfaces
├── HeroBanner.mock.ts      # fixture shared by tests (and Storybook)
├── HeroBanner.test.tsx     # happy path, missing datasource, editing mode
├── HeroBanner.module.css   # styles
└── index.ts                # re-exports
```

It also **registers** the component in `src/components/component-map.ts`.

You can also use the **Create component** form at <http://localhost:3000/components>.

### Step 2: create the rendering in Sitecore

Create a JSON rendering whose **component name is exactly `HeroBanner`**, with a datasource template whose field names match `HeroBanner.types.ts`.

> Generating files is not the same as registering a rendering in Sitecore. Both must exist, with matching names.

### Step 3: develop

- Model fields in `HeroBanner.types.ts` (names must match Sitecore template fields, case-sensitive).
- Render fields with `<Text>`, `<RichText>`, `<Image>` and `<Link>` from `@/lib/sitecore`. Do **not** render `fields.x.value` directly, because that breaks inline editing.
- Keep the `if (!fields)` guard so the component still renders without a datasource.

### Step 4: test

```bash
npm test                       # all tests
npm test -- HeroBanner         # one component
npm run test:watch             # watch mode
```

### Step 5: validate

```bash
npm run sc:component:check     # component diagnostics only
npm run sc:validate            # lint + formatting + types + tests + project health
```

### Step 6: commit and push

```bash
git add .
git commit -m "Add HeroBanner component"   # pre-commit hook: ESLint + Prettier on staged files
git push                                   # pre-push hook: type-check, tests, diagnostics
```

Open a pull request: GitHub Actions runs the full quality gate (see [section 11](#11-cicd-quality-gate-github-actions)).

---

## 7. Command reference

All toolkit commands are also available as `npm run sc -- <command>`.

| Command                                                            | What it does                                                    | Options                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| `npm run sc -- help`                                               | List all CLI commands                                           |                                             |
| `npm run sc:env:check`                                             | Validate Node.js and environment variables                      | `--strict` (warnings fail)                  |
| `npm run sc:component:create -- <Name>`                            | Scaffold + register a component                                 | `--dry-run`, `--no-map`                     |
| `npm run sc:component:map`                                         | Regenerate `component-map.ts` from the components folder        |                                             |
| `npm run sc:component:check`                                       | Component files, exports, editing support, registration         | `--strict`                                  |
| `npm run sc:graphql:schema`                                        | Download the Edge schema to `src/graphql/schema.graphql`        |                                             |
| `npm run sc:graphql:validate`                                      | Syntax, naming, duplicates, fragments, depth, schema validation | `--strict`                                  |
| `npm run sc:content:check`                                         | Compare live Sitecore layouts with registered components        | `--path /about` (repeatable)                |
| `npm run sc:project:health`                                        | Run all checks and write `reports/health.json`                  | `--content`, `--path`, `--strict`, `--json` |
| `npm run sc:validate`                                              | ESLint → Prettier → TypeScript → Jest → project health          | `--keep-going`                              |
| `npm run codegen`                                                  | Generate TypeScript types for GraphQL operations                |                                             |
| `npm run lint` / `format` / `format:check` / `type-check` / `test` | Individual quality tools                                        |                                             |

Pass options after `--`, for example:

```bash
npm run sc:project:health -- --content --path / --path /about --strict
```

**Exit codes:** `0` = no failures, `1` = at least one failure (or a warning with `--strict`). This makes every command usable in scripts and CI.

---

## 8. Working with GraphQL

### Folder conventions

```
src/graphql/
├── queries/       # one named operation per file: get-navigation.graphql → query GetNavigation
├── fragments/     # shared fragments: navigation-item-fields.graphql
├── schema.graphql # downloaded Edge schema (not committed by default)
└── generated/     # generated TypeScript types (do not edit)
```

### Step 1: validate documents (works offline)

```bash
npm run sc:graphql:validate
```

This checks syntax, named PascalCase operations that match their file names, duplicate operation and fragment names, unused and unknown fragments, and query depth (`maxDepth` in `toolkit.config.ts`).

### Step 2: download the schema (needs Sitecore credentials)

```bash
npm run sc:graphql:schema
```

After this, `sc:graphql:validate` also validates every operation **against the real schema** (unknown fields, wrong argument types and so on).

> If introspection is disabled on your endpoint, export the schema another way and save it as `src/graphql/schema.graphql`.

### Step 3: generate TypeScript types

```bash
npm run codegen
```

Types are written to `src/graphql/generated/graphql.ts`. Configuration lives in `codegen.ts`.

---

## 9. Diagnosing missing components on a page

When a component is on a page in Sitecore but does not appear on the site:

```bash
npm run sc:content:check -- --path /
npm run sc:content:check -- --path /about --path /contact
```

The command:

1. Connects to Experience Edge (or the local CM) and reports the response time.
2. Confirms the site in `NEXT_PUBLIC_DEFAULT_SITE_NAME` exists.
3. Loads the layout for each route and walks every placeholder.
4. Lists renderings whose `componentName` has **no registered React component**.

Example:

```
✖ Sitecore content
  ✔ Connection (Experience Edge) — Responded in 412 ms
  ✔ Site "corporate" — Found
  ✖ Route /about — 1 rendering(s) have no React component and will not render.
      • missing component: TeamGrid
```

The fix is usually one of the following: create the component (`sc:component:create -- TeamGrid`), correct a name mismatch, or run `sc:component:map`.

To include this check in the dashboard, open <http://localhost:3000/?content=1>.

---

## 10. Git hooks

Hooks are installed automatically by `npm install` (`prepare` → husky).

| Hook         | Runs                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `pre-commit` | `lint-staged`: ESLint `--fix` + Prettier on staged files only         |
| `pre-push`   | `type-check`, `npm test`, `sc:component:check`, `sc:graphql:validate` |

Edit them in `.husky/`. Configure lint-staged in `package.json` → `lint-staged`.

---

## 11. CI/CD quality gate (GitHub Actions)

`.github/workflows/quality.yml` runs on every pull request and every push to `main`:

1. Install (`npm ci`) with the Node version from `.nvmrc`
2. ESLint
3. Prettier check
4. TypeScript check
5. Jest with coverage thresholds (`jest.config.mjs`)
6. Component diagnostics
7. GraphQL validation
8. Live Sitecore content check (only when secrets are configured)
9. `npm audit` (high severity, production dependencies)
10. `next build`
11. Upload `reports/health.json` as a build artifact

### Enable the live content check in CI (optional)

In GitHub, go to **Settings → Secrets and variables → Actions**:

| Type     | Name                       | Value                |
| -------- | -------------------------- | -------------------- |
| Secret   | `SITECORE_EDGE_CONTEXT_ID` | Your Edge context ID |
| Variable | `SITECORE_SITE_NAME`       | Your site name       |
| Variable | `SITECORE_LANGUAGE`        | e.g. `en` (optional) |

### Make it a required check

Go to **Settings → Branches → Branch protection rules** for `main` and require the **validate** status check to pass before merging.

---

## 12. AI-assisted development

Generic AI output is often plain React that ignores Sitecore field components and editing mode. This repository ships project-specific instructions that the common assistants load automatically:

| File                              | Used by                                      |
| --------------------------------- | -------------------------------------------- |
| `AGENTS.md`                       | Codex, Claude Code (via `CLAUDE.md`), others |
| `CLAUDE.md`                       | Claude Code (imports `AGENTS.md`)            |
| `.cursor/rules/general.mdc`       | Cursor (always applied)                      |
| `.cursor/rules/sitecore.mdc`      | Cursor, for `src/**`                         |
| `.cursor/rules/components.mdc`    | Cursor, for `src/components/**`              |
| `.cursor/rules/graphql.mdc`       | Cursor, for `*.graphql`                      |
| `.cursor/rules/testing.mdc`       | Cursor, for test files                       |
| `.github/copilot-instructions.md` | GitHub Copilot                               |

The rules tell assistants to use the `sc` CLI, render fields with SDK field components, guard against missing datasources, follow the GraphQL conventions, never invent Content SDK APIs, never expose secrets, and run `npm run sc:validate` before finishing.

When your conventions change, update `AGENTS.md` and the matching `.mdc` file together.

---

## 13. Adding the toolkit to an existing Content SDK project

### Step 1: copy the toolkit files

```
scripts/                         → your-app/scripts/
src/toolkit/                     → your-app/src/toolkit/
templates/                       → your-app/templates/
toolkit.config.ts                → your-app/toolkit.config.ts
AGENTS.md, CLAUDE.md, .cursor/   → your-app/
.github/                         → your-app/.github/
.husky/                          → your-app/.husky/
```

Optionally copy `src/app/` pages into a route such as `src/app/toolkit/` if you want the dashboard inside your app (restrict it to non-production environments).

### Step 2: install the dev dependencies

```bash
npm install -D tsx @next/env graphql husky lint-staged \
  @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations \
  jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @types/jest
```

### Step 3: add the scripts

Copy the `sc:*`, `codegen` and `prepare` scripts and the `lint-staged` block from this `package.json`.

### Step 4: point field imports at the real SDK

Replace the contents of `src/lib/sitecore.tsx` with:

```ts
export * from '@sitecore-content-sdk/nextjs';
```

Generated components import `Text`, `RichText`, `Link`, `TextField` and so on from `@/lib/sitecore`, so they now use the real SDK without any other change.

### Step 5: align `toolkit.config.ts`

- `env`: the variable names your SDK version reads
- `componentsDir`: where your components live
- `componentMapFile`: see step 6

### Step 6: choose one component map

If your app already generates a component map with the Content SDK CLI (`sitecore-tools`), set `componentMapFile` to that file and **don't** use `sc:component:map`. Keep one source of truth.

### Step 7: verify

```bash
npm run sc:project:health -- --content
```

### Relationship to the official CLI

| Task                                   | Use                                                |
| -------------------------------------- | -------------------------------------------------- |
| Stock / BYOC component templates       | `sitecore-tools project component scaffold <Name>` |
| Your team's full component folder      | `npm run sc:component:create -- <Name>`            |
| Build-time SDK metadata, component map | `sitecore-tools` (as configured in your app)       |
| Diagnostics, validation, quality gates | This toolkit                                       |

---

## 14. Customising the toolkit

### Templates

Edit or add files in `templates/component/`. `__name__` in a file name is replaced with the component name. Available tokens:

| Token           | `HeroBanner` becomes |
| --------------- | -------------------- |
| `{{name}}`      | `HeroBanner`         |
| `{{camelName}}` | `heroBanner`         |
| `{{kebabName}}` | `hero-banner`        |
| `{{titleName}}` | `Hero Banner`        |

Example: add `templates/component/__name__.stories.tsx.tpl` to generate Storybook stories. Add the new pattern to `components.recommendedFiles` in `toolkit.config.ts` so diagnostics check for it.

### Rules

All rules live in `toolkit.config.ts`:

| Setting                                              | Purpose                               |
| ---------------------------------------------------- | ------------------------------------- |
| `node.minMajor`                                      | Minimum Node major version            |
| `env.required` / `anyOf` / `recommended` / `urlVars` | Environment rules                     |
| `components.requiredFiles`                           | Missing file → failure                |
| `components.recommendedFiles`                        | Missing file → warning                |
| `graphql.maxDepth`                                   | Query depth limit                     |
| `content.paths`                                      | Default routes for `sc:content:check` |
| `content.timeoutMs`                                  | Network timeout                       |

### New CLI commands

1. Add the logic to `src/toolkit/` and return a `CheckGroup` so the CLI, dashboard and health report can all use it.
2. Register the command in the `commands` object in `scripts/cli.ts`.
3. Add an `sc:*` script to `package.json`.
4. Add tests in `src/toolkit/__tests__/`.

CLI commands only run fixed npm scripts and never pass user input to a shell.

---

## 15. Project structure

```
sitecore-developer-toolkit/
├── scripts/
│   ├── cli.ts                   # the `sc` CLI
│   └── lib/output.ts            # terminal formatting
├── src/
│   ├── app/                     # Next.js dashboard (/, /components, /graphql)
│   ├── components/              # Sitecore components + generated component-map.ts
│   ├── graphql/                 # queries, fragments, schema, generated types
│   ├── lib/sitecore.tsx         # Sitecore field adapter (swap for the SDK)
│   └── toolkit/                 # check engine shared by the CLI and the dashboard
│       ├── env.ts               # environment checks
│       ├── components.ts        # scaffolding, component map, diagnostics
│       ├── graphql.ts           # GraphQL validation + schema download
│       ├── content.ts           # live Sitecore layout check
│       ├── health.ts            # aggregated report
│       └── __tests__/
├── templates/component/         # scaffolding templates
├── .cursor/rules/               # Cursor rules
├── .github/                     # CI workflow + Copilot instructions
├── .husky/                      # Git hooks
├── AGENTS.md / CLAUDE.md        # AI assistant instructions
├── codegen.ts                   # GraphQL Code Generator config
├── jest.config.mjs              # Jest + coverage thresholds
├── toolkit.config.ts            # conventions and rules
└── package.json                 # all developer commands
```

---

## 16. Troubleshooting

| Symptom                                        | Fix                                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev` stops with environment errors    | Fix what `sc:env:check` reports, or use `npm run dev:no-check`                |
| `Matches .nvmrc` warning                       | Run `nvm use`                                                                 |
| `Schema validation — skipped`                  | Run `npm run sc:graphql:schema` (needs Sitecore credentials)                  |
| `Request to … failed: fetch failed: ENOTFOUND` | Wrong host, VPN or DNS issue; check `SITECORE_EDGE_URL` / `SITECORE_API_HOST` |
| `HTTP 401/403: credentials rejected`           | Wrong context ID or API key                                                   |
| `Site "x" — Site not found`                    | Check `NEXT_PUBLIC_DEFAULT_SITE_NAME` and that the site is published to Edge  |
| `Not registered. Run npm run sc:component:map` | Run `npm run sc:component:map`                                                |
| `Stale component map entries`                  | A component folder was deleted; run `npm run sc:component:map`                |
| Prettier reports every file on Windows         | Files were saved with CRLF; run `npm run format`, and set your editor to LF   |
| Git hooks do not run                           | Run `npm install` (or `npx husky`) inside a Git repository                    |
| Create form disabled on `/components`          | It only works with `npm run dev` (development mode)                           |

---

## References

- [Install the Content SDK CLI](https://doc.sitecore.com/xmc/en/developers/content-sdk/index-en.html)
- [Sitecore Content SDK on GitHub](https://github.com/Sitecore/content-sdk)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Next.js documentation](https://nextjs.org/docs)
