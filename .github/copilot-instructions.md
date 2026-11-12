# Copilot instructions

Follow [AGENTS.md](../AGENTS.md) and the detailed rules in `.cursor/rules/`.

Key points:

- Scaffold components with `npm run sc:component:create -- Name`. Import fields from `@/lib/sitecore`.
- Render Sitecore fields with `<Text>`, `<RichText>`, `<Image>` and `<Link>`. Never render `fields.x.value` directly.
- Guard against a missing datasource.
- Put GraphQL in `src/graphql/queries`, one named operation per file.
- Do not invent Content SDK APIs. Never expose secrets through `NEXT_PUBLIC_*`.
- Run `npm run sc:validate` before finishing.
