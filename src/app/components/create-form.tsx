'use client';

import { useActionState } from 'react';
import { createComponentAction, type CreateComponentState } from '../actions';

export function CreateComponentForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState<CreateComponentState, FormData>(createComponentAction, {});

  return (
    <form action={action} className="create-form">
      <label htmlFor="component-name">Component name</label>
      <div className="row">
        <input
          id="component-name"
          name="name"
          placeholder="HeroBanner or marketing/HeroBanner"
          required
          pattern="^([a-z0-9][a-z0-9-]*/)*[A-Z][A-Za-z0-9]*$"
          title="PascalCase name, optionally prefixed by kebab-case folders"
          disabled={!enabled || pending}
          autoComplete="off"
        />
        <button type="submit" disabled={!enabled || pending}>
          {pending ? 'Creating…' : 'Create'}
        </button>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="dryRun" disabled={!enabled || pending} /> Dry run (show files only)
      </label>
      {!enabled && <p className="muted">Available while running in development mode.</p>}
      {state.message && (
        <div className={`notice ${state.ok ? 'notice-ok' : 'notice-error'}`} role="status">
          {state.message}
          {state.files && (
            <ul>
              {state.files.map((f) => (
                <li key={f}>
                  <code>{f}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
