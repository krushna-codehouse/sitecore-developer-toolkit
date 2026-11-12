import { toolkitConfig, type ToolkitConfig } from '../../toolkit.config';
import { fromRoot, readFileIfExists } from './paths';
import type { CheckGroup, CheckResult } from './types';

type Env = Record<string, string | undefined>;

const isSet = (value: string | undefined): value is string => value !== undefined && value.trim() !== '';

const PLACEHOLDER = /^(your[-_ ]|<.*>$|changeme|change-me|xxx+|todo|replace[-_ ]?me)/i;
const PUBLIC_SECRET = /(SECRET|PASSWORD|PRIVATE|TOKEN)/i;
const PUBLIC_KEY = /(API_KEY|_KEY$)/i;

/**
 * Validates the local environment. Values are never included in the output,
 * only variable names, so reports are safe to share or publish from CI.
 */
export function checkEnvironment(env: Env = process.env, config: ToolkitConfig = toolkitConfig): CheckGroup {
  const results: CheckResult[] = [];

  // Node.js version
  const major = Number(process.versions.node.split('.')[0]);
  results.push({
    id: 'node-version',
    title: 'Node.js version',
    status: major >= config.node.minMajor ? 'pass' : 'fail',
    message:
      major >= config.node.minMajor
        ? `Node ${process.versions.node}`
        : `Node ${process.versions.node} is below the supported minimum (${config.node.minMajor}).`,
  });

  const nvmrc = readFileIfExists(fromRoot('.nvmrc'))?.trim().replace(/^v/, '');
  if (nvmrc) {
    const expected = Number(nvmrc.split('.')[0]);
    results.push({
      id: 'node-nvmrc',
      title: 'Matches .nvmrc',
      status: expected === major ? 'pass' : 'warn',
      message:
        expected === major
          ? `.nvmrc pins Node ${nvmrc}`
          : `.nvmrc pins Node ${nvmrc} but you are running ${process.versions.node}. Run "nvm use".`,
    });
  }

  // Required variables
  for (const rule of config.env.required) {
    const value = env[rule.name];
    if (!isSet(value)) {
      results.push({
        id: `env-${rule.name}`,
        title: rule.name,
        status: 'fail',
        message: `Missing. ${rule.description}`,
      });
    } else if (rule.pattern && !rule.pattern.test(value)) {
      results.push({
        id: `env-${rule.name}`,
        title: rule.name,
        status: 'fail',
        message: `Invalid format. ${rule.patternHint ?? ''}`.trim(),
      });
    } else {
      results.push({ id: `env-${rule.name}`, title: rule.name, status: 'pass', message: 'Set' });
    }
  }

  // "One of" groups, e.g. Edge context ID OR local API host + key
  for (const group of config.env.anyOf) {
    const satisfied = group.options.find((option) => option.every((name) => isSet(env[name])));
    results.push({
      id: `env-anyof-${group.title}`,
      title: group.title,
      status: satisfied ? 'pass' : 'fail',
      message: satisfied
        ? `Using ${satisfied.join(' + ')}`
        : `None configured. Set one of: ${group.options.map((o) => o.join(' + ')).join('  OR  ')}`,
    });
  }

  // Recommended variables
  for (const rule of config.env.recommended) {
    results.push({
      id: `env-${rule.name}`,
      title: rule.name,
      status: isSet(env[rule.name]) ? 'pass' : 'warn',
      message: isSet(env[rule.name]) ? 'Set' : `Not set. ${rule.description}`,
    });
  }

  // URL format
  for (const name of config.env.urlVars) {
    const value = env[name];
    if (!isSet(value)) continue;
    let status: CheckResult['status'] = 'pass';
    let message = 'Valid URL';
    try {
      const url = new URL(value);
      const local = ['localhost', '127.0.0.1'].includes(url.hostname) || url.hostname.endsWith('.localhost');
      if (url.protocol !== 'https:' && !local) {
        status = 'warn';
        message = 'Not using HTTPS.';
      }
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        status = 'warn';
        message = 'Remove the trailing slash to avoid double slashes in API calls.';
      }
    } catch {
      status = 'fail';
      message = 'Not a valid absolute URL.';
    }
    results.push({ id: `env-url-${name}`, title: `${name} format`, status, message });
  }

  // Placeholder values copied from .env.example
  const placeholders = Object.entries(env)
    .filter(([key, value]) => isTrackedVar(key, config) && isSet(value) && PLACEHOLDER.test(value))
    .map(([key]) => key);
  results.push({
    id: 'env-placeholders',
    title: 'No placeholder values',
    status: placeholders.length ? 'fail' : 'pass',
    message: placeholders.length
      ? 'Some variables still contain example placeholder values.'
      : 'No example values detected',
    details: placeholders,
  });

  // Secrets accidentally exposed to the browser via NEXT_PUBLIC_
  const publicVars = Object.keys(env).filter((key) => key.startsWith('NEXT_PUBLIC_') && isSet(env[key]));
  const leakedSecrets = publicVars.filter((key) => PUBLIC_SECRET.test(key));
  const publicKeys = publicVars.filter((key) => !PUBLIC_SECRET.test(key) && PUBLIC_KEY.test(key));
  results.push({
    id: 'env-public-secrets',
    title: 'No secrets in NEXT_PUBLIC_ variables',
    status: leakedSecrets.length ? 'fail' : publicKeys.length ? 'warn' : 'pass',
    message: leakedSecrets.length
      ? 'These look like secrets but are bundled into client-side JavaScript.'
      : publicKeys.length
        ? 'These API keys are exposed to the browser. Confirm they are meant to be public.'
        : 'No secret-looking public variables',
    details: [...leakedSecrets, ...publicKeys],
  });

  return { id: 'environment', title: 'Environment', results };
}

function isTrackedVar(key: string, config: ToolkitConfig): boolean {
  return (
    key.startsWith('SITECORE_') ||
    key.startsWith('NEXT_PUBLIC_') ||
    config.env.required.some((r) => r.name === key) ||
    config.env.recommended.some((r) => r.name === key)
  );
}
