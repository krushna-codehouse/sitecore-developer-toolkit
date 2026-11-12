import { toolkitConfig, type ToolkitConfig } from '../../toolkit.config';
import { readComponentMap } from './components';
import { resolveEndpoint, type SitecoreEndpoint } from './sitecore-endpoint';
import type { CheckGroup, CheckResult } from './types';

const SITE_QUERY = /* GraphQL */ `
  query ToolkitSiteInfo($site: String!) {
    site {
      siteInfo(site: $site) {
        name
      }
    }
  }
`;

const LAYOUT_QUERY = /* GraphQL */ `
  query ToolkitLayout($site: String!, $routePath: String!, $language: String!) {
    layout(site: $site, routePath: $routePath, language: $language) {
      item {
        rendered
      }
    }
  }
`;

interface RenderingNode {
  componentName?: string;
  dataSource?: string;
  fields?: unknown;
  placeholders?: Record<string, RenderingNode[]>;
}

export interface ContentCheckOptions {
  paths?: string[];
  env?: Record<string, string | undefined>;
  config?: ToolkitConfig;
}

/**
 * Connects to Sitecore, loads the layout for each route and reports renderings
 * that have no matching React component — the most common reason a component
 * "disappears" from a page.
 */
export async function checkContent(options: ContentCheckOptions = {}): Promise<CheckGroup> {
  const env = options.env ?? process.env;
  const config = options.config ?? toolkitConfig;
  const results: CheckResult[] = [];
  const group: CheckGroup = { id: 'content', title: 'Sitecore content', results };

  const endpoint = resolveEndpoint(env, config);
  const site = env.NEXT_PUBLIC_DEFAULT_SITE_NAME;
  const language = env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en';

  if (!endpoint || !site) {
    results.push({
      id: 'connection',
      title: 'Connection',
      status: 'skip',
      message: 'Sitecore connection or site name not configured. Run `npm run sc:env:check`.',
    });
    return group;
  }

  // 1. Connectivity + site resolution
  try {
    const started = Date.now();
    const data = await gql<{ site?: { siteInfo?: { name: string } | null } }>(endpoint, SITE_QUERY, { site }, config);
    const elapsed = Date.now() - started;
    results.push({
      id: 'connection',
      title: `Connection (${endpoint.kind === 'edge' ? 'Experience Edge' : 'local CM'})`,
      status: elapsed > 3000 ? 'warn' : 'pass',
      message: `Responded in ${elapsed} ms${elapsed > 3000 ? ' (slow)' : ''}`,
    });
    results.push({
      id: 'site',
      title: `Site "${site}"`,
      status: data.site?.siteInfo ? 'pass' : 'fail',
      message: data.site?.siteInfo
        ? 'Found'
        : 'Site not found. Check NEXT_PUBLIC_DEFAULT_SITE_NAME and that the site is published.',
    });
    if (!data.site?.siteInfo) return group;
  } catch (error) {
    results.push({ id: 'connection', title: 'Connection', status: 'fail', message: (error as Error).message });
    return group;
  }

  // 2. Layout per route vs component map
  const registered = new Set(readComponentMap(config) ?? []);
  for (const routePath of options.paths?.length ? options.paths : config.content.paths) {
    try {
      const data = await gql<{ layout?: { item?: { rendered?: unknown } | null } | null }>(
        endpoint,
        LAYOUT_QUERY,
        { site, routePath, language },
        config,
      );
      const rendered = data.layout?.item?.rendered as
        { sitecore?: { route?: { placeholders?: Record<string, RenderingNode[]> } | null } } | undefined;
      const route = rendered?.sitecore?.route;

      if (!route) {
        results.push({
          id: `route-${routePath}`,
          title: `Route ${routePath}`,
          status: 'warn',
          message: `No published route found for language "${language}".`,
        });
        continue;
      }

      const renderings = collectRenderings(route.placeholders ?? {});
      const names = [...new Set(renderings.map((r) => r.componentName).filter((n): n is string => Boolean(n)))];
      const missing = names.filter((n) => !registered.has(n));
      const noDatasource = renderings.filter(
        (r) => r.componentName && registered.has(r.componentName) && r.fields === undefined && !r.dataSource,
      );

      results.push({
        id: `route-${routePath}`,
        title: `Route ${routePath}`,
        // Renderings without a datasource are listed for information only; many are intentional.
        status: missing.length ? 'fail' : 'pass',
        message: missing.length
          ? `${missing.length} rendering(s) have no React component and will not render.`
          : `${renderings.length} rendering(s), ${names.length} component type(s), all registered`,
        details: [
          ...missing.map((n) => `missing component: ${n}`),
          ...noDatasource.map((r) => `no datasource (check this is intended): ${r.componentName}`),
        ],
      });
    } catch (error) {
      results.push({
        id: `route-${routePath}`,
        title: `Route ${routePath}`,
        status: 'fail',
        message: (error as Error).message,
      });
    }
  }

  return group;
}

function collectRenderings(placeholders: Record<string, RenderingNode[]>): RenderingNode[] {
  const out: RenderingNode[] = [];
  for (const renderings of Object.values(placeholders)) {
    for (const rendering of renderings ?? []) {
      out.push(rendering);
      if (rendering.placeholders) out.push(...collectRenderings(rendering.placeholders));
    }
  }
  return out;
}

async function gql<T>(
  endpoint: SitecoreEndpoint,
  query: string,
  variables: Record<string, unknown>,
  config: ToolkitConfig,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...endpoint.headers },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(config.content.timeoutMs),
      cache: 'no-store',
    });
  } catch (error) {
    const err = error as Error & { cause?: { code?: string; message?: string } };
    const reason =
      err.name === 'TimeoutError'
        ? `timed out after ${config.content.timeoutMs} ms`
        : // Node's fetch hides the real reason (DNS, refused, TLS) in `cause`.
          [err.message, err.cause?.code ?? err.cause?.message].filter(Boolean).join(': ');
    throw new Error(`Request to ${new URL(endpoint.url).host} failed: ${reason}`);
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(`HTTP ${response.status}: credentials rejected. Check the context ID / API key.`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!json.data) throw new Error('Empty GraphQL response');
  return json.data;
}
