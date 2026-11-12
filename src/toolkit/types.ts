export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export interface CheckResult {
  id: string;
  title: string;
  status: CheckStatus;
  message: string;
  details?: string[];
}

export interface CheckGroup {
  id: string;
  title: string;
  results: CheckResult[];
}

export interface HealthReport {
  generatedAt: string;
  status: Exclude<CheckStatus, 'skip'>;
  summary: Record<CheckStatus, number>;
  groups: CheckGroup[];
}

export function groupStatus(group: CheckGroup): CheckStatus {
  const statuses = group.results.map((r) => r.status);
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warn')) return 'warn';
  if (statuses.length > 0 && statuses.every((s) => s === 'skip')) return 'skip';
  return 'pass';
}
