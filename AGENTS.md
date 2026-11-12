# AGENTS.md

Instructions for AI coding assistants (Claude Code, Cursor, GitHub Copilot, Codex) working in this repository.

## Project

A Next.js (App Router, TypeScript) Sitecore Content SDK project with a developer productivity toolkit:

- `scripts/cli.ts`: the `sc` developer CLI (`npm run sc -- help`)
- `src/toolkit/`: check engine shared by the CLI and the dashboard (`src/app`)
- `src/components/`: Sitecore components, one folder per rendering
- `src/graphql/`: GraphQL operations, fragments and generated types
- `templates/component/`: scaffolding templates
- `toolkit.config.ts`: single source of truth for conventions

## Always

1. Create components with `npm run sc:component:create -- [folder/]Name`. Do not hand-create component folders.
2. Import Sitecore field types and field components from `@/lib/sitecore`, never from the SDK directly.
3. Render fields with `<Text>`, `<RichText>`, `<Image>` and `<Link>` so authors can edit inline. Never render `fields.x.value` directly in JSX.
4. Handle a missing datasource (`if (!fields)`), because renderings can be added without one.
5. Keep the component folder name, the default export and the Sitecore rendering name identical.
6. After adding, moving or deleting a component, run `npm run sc:component:map`. Never edit `component-map.ts` by hand.
7. Put GraphQL in `src/graphql/queries/*.graphql`, one named operation per file. The file name is the kebab-case operation name.
8. Run `npm run sc:validate` before declaring a task done, and report its result truthfully.

## Never

- Invent Content SDK APIs, hooks or props. If unsure, check the SDK docs or existing code and say so.
- Put secrets in `NEXT_PUBLIC_*` variables or client components.
- Commit `.env.local`, `reports/*.json` or generated GraphQL types.
- Disable lint rules, skip tests or lower coverage thresholds to make checks pass.

## Commands

| Task                  | Command                                        |
| --------------------- | ---------------------------------------------- |
| Check environment     | `npm run sc:env:check`                         |
| New component         | `npm run sc:component:create -- HeroBanner`    |
| Component diagnostics | `npm run sc:component:check`                   |
| GraphQL validation    | `npm run sc:graphql:validate`                  |
| GraphQL types         | `npm run sc:graphql:schema && npm run codegen` |
| Live content check    | `npm run sc:content:check -- --path /about`    |
| Everything            | `npm run sc:validate`                          |

Detailed rules live in `.cursor/rules/*.mdc`. They apply to all assistants, not just Cursor.
