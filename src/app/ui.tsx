import type { CheckGroup, CheckResult, CheckStatus } from '@/toolkit/types';
import { groupStatus } from '@/toolkit/types';

const LABEL: Record<CheckStatus, string> = { pass: 'Pass', warn: 'Warning', fail: 'Fail', skip: 'Skipped' };

export function StatusBadge({ status }: { status: CheckStatus }) {
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}

export function ResultRow({ result }: { result: CheckResult }) {
  return (
    <li className="result">
      <StatusBadge status={result.status} />
      <div>
        <div className="result-title">{result.title}</div>
        <div className="result-message">{result.message}</div>
        {result.details && result.details.length > 0 && (
          <ul className="details">
            {result.details.map((d) => (
              <li key={d}>
                <code>{d}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function GroupCard({ group, footer }: { group: CheckGroup; footer?: React.ReactNode }) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{group.title}</h2>
        <StatusBadge status={groupStatus(group)} />
      </header>
      <ul className="results">
        {group.results.map((r) => (
          <ResultRow key={r.id} result={r} />
        ))}
      </ul>
      {footer && <footer className="card-foot">{footer}</footer>}
    </section>
  );
}

export function Command({ children }: { children: string }) {
  return <code className="cmd">{children}</code>;
}
