import { toolkitConfig, type ToolkitConfig } from '../../toolkit.config';

export interface SitecoreEndpoint {
  kind: 'edge' | 'local';
  url: string;
  headers: Record<string, string>;
}

/**
 * Resolves the GraphQL endpoint from the environment:
 *  - Experience Edge (XM Cloud / SitecoreAI) via SITECORE_EDGE_CONTEXT_ID
 *  - A local or self-hosted CM via SITECORE_API_HOST + SITECORE_API_KEY
 */
export function resolveEndpoint(
  env: Record<string, string | undefined> = process.env,
  config: ToolkitConfig = toolkitConfig,
): SitecoreEndpoint | undefined {
  const contextId = env.SITECORE_EDGE_CONTEXT_ID?.trim();
  if (contextId) {
    const base = (env.SITECORE_EDGE_URL?.trim() || config.content.defaultEdgeUrl).replace(/\/+$/, '');
    return {
      kind: 'edge',
      url: `${base}/v1/content/api/graphql/v1?sitecoreContextId=${encodeURIComponent(contextId)}`,
      headers: {},
    };
  }

  const host = env.SITECORE_API_HOST?.trim();
  const apiKey = env.SITECORE_API_KEY?.trim();
  if (host && apiKey) {
    return {
      kind: 'local',
      url: `${host.replace(/\/+$/, '')}/sitecore/api/graph/edge`,
      headers: { sc_apikey: apiKey },
    };
  }

  return undefined;
}
