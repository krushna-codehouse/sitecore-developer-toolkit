import toolkitConfig from '../../../toolkit.config';
import { checkComponents, inspectComponents } from '@/toolkit/components';
import type { CheckStatus } from '@/toolkit/types';
import { Command, GroupCard, StatusBadge } from '../ui';
import { CreateComponentForm } from './create-form';

export const dynamic = 'force-dynamic';

export default function ComponentsPage() {
  const { components } = inspectComponents();
  const group = checkComponents();
  const patterns = [...toolkitConfig.components.requiredFiles, ...toolkitConfig.components.recommendedFiles];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Components</h1>
          <p className="muted">
            {components.length} component(s) in <code>{toolkitConfig.componentsDir}</code>
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <header className="card-head">
            <h2>Create a component</h2>
          </header>
          <CreateComponentForm enabled={process.env.NODE_ENV === 'development'} />
          <p className="muted small">
            Same as <Command>npm run sc:component:create -- Name</Command>. Templates live in{' '}
            <code>{toolkitConfig.templatesDir}</code>.
          </p>
        </section>
        <GroupCard group={group} />
      </div>

      <section className="card">
        <header className="card-head">
          <h2>File matrix</h2>
        </header>
        <div className="table-scroll">
          <table className="table matrix">
            <thead>
              <tr>
                <th>Component</th>
                {patterns.map((p) => (
                  <th key={p}>{p.replace('{name}', '')}</th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => {
                const status: CheckStatus = c.results.some((r) => r.status === 'fail')
                  ? 'fail'
                  : c.results.some((r) => r.status === 'warn')
                    ? 'warn'
                    : 'pass';
                return (
                  <tr key={c.relativeDir}>
                    <td>
                      <strong>{c.name}</strong>
                      <div className="muted small">{c.relativeDir}</div>
                    </td>
                    {patterns.map((p) => {
                      const present = c.files.includes(p.replace(/\{name\}/g, c.name));
                      return (
                        <td key={p} className={present ? 'yes' : 'no'} aria-label={present ? 'present' : 'missing'}>
                          {present ? '✓' : '—'}
                        </td>
                      );
                    })}
                    <td>
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
