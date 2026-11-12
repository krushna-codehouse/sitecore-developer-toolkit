import fs from 'node:fs';
import path from 'node:path';
import { checkComponents } from './components';
import { checkContent } from './content';
import { checkEnvironment } from './env';
import { validateGraphQL } from './graphql';
import { fromRoot, relativeToRoot } from './paths';
import type { CheckGroup, CheckStatus, HealthReport } from './types';

export interface HealthOptions {
  /** Also call Sitecore (network). Off by default so the check is fast and works offline. */
  includeContent?: boolean;
  contentPaths?: string[];
}

export async function runHealthChecks(options: HealthOptions = {}): Promise<HealthReport> {
  const groups: CheckGroup[] = [checkEnvironment(), checkComponents(), validateGraphQL()];
  if (options.includeContent) groups.push(await checkContent({ paths: options.contentPaths }));
  return buildReport(groups);
}

export function buildReport(groups: CheckGroup[]): HealthReport {
  const summary: Record<CheckStatus, number> = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const group of groups) for (const result of group.results) summary[result.status] += 1;
  return {
    generatedAt: new Date().toISOString(),
    status: summary.fail ? 'fail' : summary.warn ? 'warn' : 'pass',
    summary,
    groups,
  };
}

export function writeReport(report: HealthReport, file = fromRoot('reports', 'health.json')): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return relativeToRoot(file);
}
