'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { AdminActionState } from '@/lib/admin-payload';
import { updateSettingsAction } from '@/server/actions/admin-settings';

const initialState: AdminActionState = { status: 'idle' };

type GroupKey = 'contact' | 'socials' | 'external' | 'seo';

const FIELD_GROUPS: Array<{
  key: GroupKey;
  title: string;
  intro: string;
  fields: Array<{ name: string; label: string; type?: 'url' | 'email' | 'text' | 'textarea'; hint?: string }>;
}> = [
  {
    key: 'contact',
    title: 'Contact details',
    intro: 'Shown in the site footer, contact page and forms.',
    fields: [
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Primary email', type: 'email' },
      { name: 'generalEmail', label: 'General enquiries email', type: 'email' },
      { name: 'mapUrl', label: 'Map link', type: 'url' },
    ],
  },
  {
    key: 'socials',
    title: 'Social profiles',
    intro: 'Leave empty to hide a link in the footer.',
    fields: [
      { name: 'facebook', label: 'Facebook', type: 'url' },
      { name: 'twitter', label: 'X / Twitter', type: 'url' },
      { name: 'youtube', label: 'YouTube', type: 'url' },
      { name: 'instagram', label: 'Instagram', type: 'url' },
    ],
  },
  {
    key: 'external',
    title: 'External links',
    intro: 'Important partner and board links.',
    fields: [
      { name: 'upcomingEvents', label: 'Upcoming events blog', type: 'url' },
      { name: 'gujcost', label: 'GUJCOST', type: 'url' },
      { name: 'dst', label: 'DST Govt. of India', type: 'url' },
    ],
  },
  {
    key: 'seo',
    title: 'Search & organisation',
    intro: 'Defaults used across pages and metadata.',
    fields: [
      { name: 'organisationName', label: 'Organisation name' },
      { name: 'defaultDescription', label: 'Default site description', type: 'textarea' },
    ],
  },
];

export default function SettingsForm({
  settings,
}: {
  settings: Record<GroupKey, Record<string, string>>;
}) {
  const [values, setValues] = useState(settings);
  const [state, action, pending] = useActionState(updateSettingsAction, initialState);

  useEffect(() => setValues(settings), [settings]);

  useEffect(() => {
    if (state.status === 'success') {
      const timer = window.setTimeout(() => window.location.reload(), 700);
      return () => window.clearTimeout(timer);
    }
  }, [state.status]);

  const setField = (group: GroupKey, field: string, value: string) =>
    setValues((previous) => ({
      ...previous,
      [group]: { ...previous[group], [field]: value },
    }));

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const input = form.querySelector<HTMLInputElement>('input[name="payload"]');
        if (input) input.value = JSON.stringify(values);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="payload" />

      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' && state.fieldErrors && Object.keys(state.fieldErrors).length > 0 ? (
        <ul className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-xs text-danger">
          {Object.entries(state.fieldErrors).map(([field, message]) => (
            <li key={field}>{`${field}: ${message}`}</li>
          ))}
        </ul>
      ) : null}

      {FIELD_GROUPS.map((group) => (
        <section key={group.key} className="admin-card">
          <div className="border-b border-line px-6 py-4">
            <h2 className="font-display text-lg font-semibold">{group.title}</h2>
            <p className="mt-1 text-xs text-ink-muted">{group.intro}</p>
          </div>
          <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="admin-label" htmlFor={`settings-${group.key}-${field.name}`}>
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`settings-${group.key}-${field.name}`}
                    rows={2}
                    value={values[group.key]?.[field.name] ?? ''}
                    onChange={(event) => setField(group.key, field.name, event.target.value)}
                    className="admin-input"
                  />
                ) : (
                  <input
                    id={`settings-${group.key}-${field.name}`}
                    type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
                    value={values[group.key]?.[field.name] ?? ''}
                    onChange={(event) => setField(group.key, field.name, event.target.value)}
                    className="admin-input"
                  />
                )}
                {field.hint ? <p className="mt-1.5 text-xs text-ink-muted">{field.hint}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-2.5">
        <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          Save settings
        </button>
      </div>
    </form>
  );
}

export type { GroupKey };
