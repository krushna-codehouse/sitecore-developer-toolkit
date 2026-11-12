import toolkitConfig from '../../../toolkit.config';
import { loadGraphQLFiles, validateGraphQL } from '@/toolkit/graphql';
import { Command, GroupCard } from '../ui';

export const dynamic = 'force-dynamic';

export default function GraphQLPage() {
  const files = loadGraphQLFiles();
  const group = validateGraphQL();
  const operations = files.flatMap((f) => f.operations.map((op) => ({ ...op, file: f.file })));
  const fragments = files.flatMap((f) => f.fragments.map((name) => ({ name, file: f.file })));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>GraphQL</h1>
          <p className="muted">
            {operations.length} operation(s) and {fragments.length} fragment(s) in{' '}
            <code>{toolkitConfig.graphql.dir}</code>
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <GroupCard
          group={group}
          footer={
            <p className="muted small">
              Generate types with <Command>npm run codegen</Command> after <Command>npm run sc:graphql:schema</Command>.
            </p>
          }
        />
        <section className="card">
          <header className="card-head">
            <h2>Operations</h2>
          </header>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Variables</th>
                  <th>Depth</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={`${op.file}-${op.name}`}>
                    <td>
                      <strong>{op.name ?? '(anonymous)'}</strong>
                      <div className="muted small">{op.file}</div>
                    </td>
                    <td>{op.type}</td>
                    <td>{op.variables.map((v) => `$${v}`).join(', ') || '—'}</td>
                    <td className={op.depth > toolkitConfig.graphql.maxDepth ? 'no' : undefined}>{op.depth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Fragments</h3>
          <ul className="plain">
            {fragments.map((f) => (
              <li key={`${f.file}-${f.name}`}>
                <strong>{f.name}</strong> <span className="muted small">{f.file}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
