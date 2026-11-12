import Link from 'next/link';
import { runHealthChecks } from '@/toolkit/health';
import { Command, GroupCard } from './ui';

export const dynamic = 'force-dynamic';

const COMMANDS: [string, string][] = [
  ['npm run sc:env:check', 'Validate Node.js and environment variables'],
  ['npm run sc:component:create -- HeroBanner', 'Scaffold a component and register it'],
  ['npm run sc:component:check', 'Diagnose component files and registration'],
  ['npm run sc:graphql:validate', 'Validate GraphQL documents'],
  ['npm run sc:content:check', 'Find renderings with no React component'],
  ['npm run sc:project:health', 'Run everything and write reports/health.json'],
  ['npm run sc:validate', 'Lint, format, type-check, test and health'],
];

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ content?: string }> }) {
  const { content } = await searchParams;
  const includeContent = content === '1';
  const report = await runHealthChecks({ includeContent });
  const { pass, warn, fail, skip } = report.summary;
  const scored = pass + warn + fail;
  const score = scored ? Math.round((pass / scored) * 100) : 100;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Project health</h1>
          <p className="muted">
            Generated {new Date(report.generatedAt).toLocaleString()} ·{' '}
            {includeContent ? (
              <Link href="/">Skip Sitecore content check</Link>
            ) : (
              <Link href="/?content=1">Include live Sitecore content check</Link>
            )}
          </p>
        </div>
      </div>

      <div className="stats">
        <div className={`stat stat-${report.status}`}>
          <span className="stat-value">{score}%</span>
          <span className="stat-label">Health score</span>
        </div>
        <div className="stat">
          <span className="stat-value">{pass}</span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="stat">
          <span className="stat-value">{warn}</span>
          <span className="stat-label">Warnings</span>
        </div>
        <div className="stat">
          <span className="stat-value">{fail}</span>
          <span className="stat-label">Failed</span>
        </div>
        <div className="stat">
          <span className="stat-value">{skip}</span>
          <span className="stat-label">Skipped</span>
        </div>
      </div>

      <div className="grid">
        {report.groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      <section className="card">
        <header className="card-head">
          <h2>Developer commands</h2>
        </header>
        <table className="table">
          <tbody>
            {COMMANDS.map(([cmd, desc]) => (
              <tr key={cmd}>
                <td>
                  <Command>{cmd}</Command>
                </td>
                <td className="muted">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
