#!/usr/bin/env tsx
/**
 * Sitecore developer CLI.
 *
 *   npm run sc -- <command> [options]
 *   npm run sc:component:create -- marketing/HeroBanner
 *
 * Commands never pass user input to a shell. External tools are started with
 * fixed, known script names only.
 */
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadEnvConfig } from '@next/env';
import {
  buildReport,
  checkComponents,
  checkContent,
  checkEnvironment,
  createComponent,
  downloadSchema,
  runHealthChecks,
  validateGraphQL,
  writeComponentMap,
  writeReport,
} from '../src/toolkit';
import { color, exitCodeFor, printGroup, printSummary } from './lib/output';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', { info: () => {}, error: console.error });

interface Command {
  description: string;
  usage?: string;
  run(args: string[]): Promise<number> | number;
}

const commands: Record<string, Command> = {
  'env:check': {
    description: 'Validate Node.js version and Sitecore environment variables',
    usage: '[--strict]',
    run(args) {
      const { values } = parseArgs({ args, options: { strict: { type: 'boolean' } }, allowPositionals: true });
      const group = checkEnvironment();
      printGroup(group);
      printSummary(buildReport([group]));
      return exitCodeFor([group], values.strict);
    },
  },

  'component:create': {
    description: 'Scaffold a component from templates/component and register it',
    usage: '<[folder/]ComponentName> [--dry-run] [--no-map]',
    run(args) {
      const { values, positionals } = parseArgs({
        args,
        options: { 'dry-run': { type: 'boolean' }, 'no-map': { type: 'boolean' } },
        allowPositionals: true,
      });
      const target = positionals[0];
      if (!target) {
        console.error(color.red('Usage: npm run sc:component:create -- [folder/]ComponentName'));
        return 1;
      }
      try {
        const result = createComponent(target, { dryRun: values['dry-run'], updateMap: !values['no-map'] });
        console.log(
          `\n${color.green('✔')} ${result.dryRun ? 'Would create' : 'Created'} ${color.bold(result.name)} in ${result.dir}`,
        );
        result.files.forEach((f) => console.log(color.gray(`   + ${f}`)));
        if (!result.dryRun) {
          console.log(`\nNext steps:
  1. Create a rendering in Sitecore whose component name is ${color.cyan(result.name)}.
  2. Model the datasource fields in ${color.cyan(`${result.name}.types.ts`)}.
  3. Run ${color.cyan('npm test')} and ${color.cyan('npm run sc:component:check')}.\n`);
        }
        return 0;
      } catch (error) {
        console.error(color.red(`✖ ${(error as Error).message}`));
        return 1;
      }
    },
  },

  'component:map': {
    description: 'Regenerate the component map from the components folder',
    run() {
      const { file, count } = writeComponentMap();
      console.log(`${color.green('✔')} Wrote ${file} (${count} components)`);
      return 0;
    },
  },

  'component:check': {
    description: 'Diagnose component files, exports, editing support and registration',
    usage: '[--strict]',
    run(args) {
      const { values } = parseArgs({ args, options: { strict: { type: 'boolean' } }, allowPositionals: true });
      const group = checkComponents();
      printGroup(group);
      printSummary(buildReport([group]));
      return exitCodeFor([group], values.strict);
    },
  },

  'graphql:schema': {
    description: 'Download the Experience Edge schema (introspection) for validation and codegen',
    async run() {
      try {
        const { file, types } = await downloadSchema();
        console.log(`${color.green('✔')} Saved ${file} (${types} types)`);
        return 0;
      } catch (error) {
        console.error(color.red(`✖ ${(error as Error).message}`));
        return 1;
      }
    },
  },

  'graphql:validate': {
    description: 'Validate syntax, naming, duplicates, fragments, depth and schema',
    usage: '[--strict]',
    run(args) {
      const { values } = parseArgs({ args, options: { strict: { type: 'boolean' } }, allowPositionals: true });
      const group = validateGraphQL();
      printGroup(group);
      printSummary(buildReport([group]));
      return exitCodeFor([group], values.strict);
    },
  },

  'content:check': {
    description: 'Compare renderings on live Sitecore pages with registered components',
    usage: '[--path /about] [--path /contact]',
    async run(args) {
      const { values } = parseArgs({
        args,
        options: { path: { type: 'string', multiple: true } },
        allowPositionals: true,
      });
      const group = await checkContent({ paths: values.path });
      printGroup(group);
      printSummary(buildReport([group]));
      return exitCodeFor([group]);
    },
  },

  'project:health': {
    description: 'Run every check, print a report and write reports/health.json',
    usage: '[--content] [--path /route] [--strict] [--json]',
    async run(args) {
      const { values } = parseArgs({
        args,
        options: {
          content: { type: 'boolean' },
          path: { type: 'string', multiple: true },
          strict: { type: 'boolean' },
          json: { type: 'boolean' },
        },
        allowPositionals: true,
      });
      const report = await runHealthChecks({ includeContent: values.content, contentPaths: values.path });
      const file = writeReport(report);
      if (values.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        report.groups.forEach(printGroup);
        printSummary(report);
        console.log(color.gray(`Report written to ${file}`));
      }
      return exitCodeFor(report.groups, values.strict);
    },
  },

  validate: {
    description: 'Run lint, formatting, type-check, tests and project health in one go',
    usage: '[--keep-going]',
    async run(args) {
      const { values } = parseArgs({ args, options: { 'keep-going': { type: 'boolean' } }, allowPositionals: true });
      const steps: { label: string; script: string; extra?: string[] }[] = [
        { label: 'ESLint', script: 'lint' },
        { label: 'Prettier', script: 'format:check' },
        { label: 'TypeScript', script: 'type-check' },
        { label: 'Jest', script: 'test', extra: ['--', '--ci'] },
      ];
      const outcomes: { label: string; ok: boolean; ms: number }[] = [];

      for (const step of steps) {
        console.log(`\n${color.cyan('▶')} ${color.bold(step.label)}`);
        const started = Date.now();
        // Fixed script names only; shell is needed for npm.cmd on Windows.
        const result = spawnSync('npm', ['run', step.script, ...(step.extra ?? [])], {
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
        const ok = result.status === 0;
        outcomes.push({ label: step.label, ok, ms: Date.now() - started });
        if (!ok && !values['keep-going']) break;
      }

      if (outcomes.every((o) => o.ok) || values['keep-going']) {
        console.log(`\n${color.cyan('▶')} ${color.bold('Project health')}`);
        const started = Date.now();
        const report = await runHealthChecks();
        report.groups.forEach(printGroup);
        outcomes.push({ label: 'Project health', ok: report.status !== 'fail', ms: Date.now() - started });
      }

      console.log(`\n${color.bold('Validation summary')}`);
      for (const o of outcomes) {
        console.log(
          `  ${o.ok ? color.green('✔') : color.red('✖')} ${o.label.padEnd(16)} ${color.gray(`${(o.ms / 1000).toFixed(1)}s`)}`,
        );
      }
      const skipped = steps.length + 1 - outcomes.length;
      if (skipped > 0) console.log(color.gray(`  ○ ${skipped} step(s) skipped after failure (use --keep-going)`));
      console.log('');
      return outcomes.every((o) => o.ok) && skipped === 0 ? 0 : 1;
    },
  },
};

function printHelp(): void {
  console.log(`\n${color.bold('Sitecore developer toolkit')}\n\nUsage: npm run sc -- <command> [options]\n`);
  const width = Math.max(...Object.keys(commands).map((k) => k.length));
  for (const [name, command] of Object.entries(commands)) {
    console.log(`  ${color.cyan(name.padEnd(width))}  ${command.description}`);
    if (command.usage) console.log(color.gray(`  ${' '.repeat(width)}  ${name} ${command.usage}`));
  }
  console.log('');
}

async function main(): Promise<void> {
  const [name, ...args] = process.argv.slice(2);
  if (!name || name === 'help' || name === '--help' || name === '-h') {
    printHelp();
    process.exit(name ? 0 : 1);
  }
  const command = commands[name];
  if (!command) {
    console.error(color.red(`Unknown command "${name}".`));
    printHelp();
    process.exit(1);
  }
  process.exit(await command.run(args));
}

main().catch((error) => {
  console.error(color.red(error instanceof Error ? (error.stack ?? error.message) : String(error)));
  process.exit(1);
});
