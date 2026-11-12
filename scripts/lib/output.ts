import type { CheckGroup, CheckStatus, HealthReport } from '../../src/toolkit/types';
import { groupStatus } from '../../src/toolkit/types';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (text: string) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);

export const color = {
  green: paint(32),
  yellow: paint(33),
  red: paint(31),
  gray: paint(90),
  cyan: paint(36),
  bold: paint(1),
};

const ICONS: Record<CheckStatus, string> = {
  pass: color.green('✔'),
  warn: color.yellow('⚠'),
  fail: color.red('✖'),
  skip: color.gray('○'),
};

export function printGroup(group: CheckGroup): void {
  console.log(`\n${ICONS[groupStatus(group)]} ${color.bold(group.title)}`);
  for (const result of group.results) {
    console.log(`  ${ICONS[result.status]} ${result.title} ${color.gray('—')} ${result.message}`);
    for (const detail of result.details ?? []) console.log(color.gray(`      • ${detail}`));
  }
}

export function printSummary(report: Pick<HealthReport, 'summary' | 'status'>): void {
  const { pass, warn, fail, skip } = report.summary;
  const line = `${color.green(`${pass} passed`)}, ${color.yellow(`${warn} warnings`)}, ${color.red(`${fail} failed`)}, ${color.gray(`${skip} skipped`)}`;
  console.log(`\n${ICONS[report.status]} ${color.bold('Summary:')} ${line}\n`);
}

export function exitCodeFor(groups: CheckGroup[], strict = false): number {
  const statuses = groups.flatMap((g) => g.results.map((r) => r.status));
  if (statuses.includes('fail')) return 1;
  if (strict && statuses.includes('warn')) return 1;
  return 0;
}
