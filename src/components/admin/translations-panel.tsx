'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { Languages, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { regenerateTranslationAction, translateAllAction, type TranslationActionState } from '@/server/actions/admin-translations';

export interface TranslationRow {
  type: string;
  typeLabel: string;
  id: string;
  title: string;
  locales: Array<{
    locale: 'GU' | 'HI';
    status: string;
    provider: string | null;
    translatedAt: string | null;
    attempts: number;
    lastError: string | null;
    stale: boolean;
    hasLegacyBackup: boolean;
  }>;
}

const initial: TranslationActionState = { status: 'idle' };

const STATUS_STYLE: Record<string, string> = {
  DONE: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800',
  STALE: 'border-amber-600/25 bg-amber-500/10 text-amber-800',
  PENDING: 'border-line bg-warm-ivory text-ink-muted',
  FAILED: 'border-danger/25 bg-danger/5 text-danger',
  LEGACY: 'border-line bg-saffron-light text-saffron-dark',
  MISSING: 'border-line bg-paper text-ink-muted',
};
const STATUS_LABEL: Record<string, string> = {
  DONE: 'Up to date',
  STALE: 'Out of date',
  PENDING: 'Waiting',
  FAILED: 'Failed',
  LEGACY: 'Hand-written (legacy)',
  MISSING: 'Not translated',
};

function Notice({ state }: { state: TranslationActionState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <p
      role={state.status === 'error' ? 'alert' : 'status'}
      className={cn(
        'mx-6 mt-4 rounded-xl border px-4 py-3 text-sm',
        state.status === 'error' ? 'border-danger/25 bg-danger/5 text-danger' : 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800',
      )}
    >
      {state.message}
    </p>
  );
}

function RegenerateButton({ type, id, title, onResult }: { type: string; id: string; title: string; onResult: (state: TranslationActionState) => void }) {
  const [pending, startTransition] = useTransition();
  // The result is reported at panel level: once up to date, the row may leave
  // the "needs attention" list in the same render that delivers the result.
  const run = (formData: FormData) =>
    startTransition(async () => {
      const result = await regenerateTranslationAction(initial, formData);
      onResult({ status: result.status, message: `${title}: ${result.message ?? ''}` });
    });
  return (
    <form action={run} className="grid justify-items-end gap-1">
      <input type="hidden" name="entityType" value={type} />
      <input type="hidden" name="entityId" value={id} />
      <button type="submit" disabled={pending} className="admin-btn admin-btn-ghost !py-1 !text-[11px]">
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-3.5" aria-hidden="true" />}
        Regenerate
      </button>
    </form>
  );
}

export function TranslationsPanel({ rows, configured, provider, configMessage }: { rows: TranslationRow[]; configured: boolean; provider: string | null; configMessage: string | null }) {
  const [allState, allAction, allPending] = useActionState(translateAllAction, initial);
  const [filter, setFilter] = useState<'all' | 'attention'>('attention');
  const [rowResult, setRowResult] = useState<TranslationActionState>(initial);
  const needsAttention = (row: TranslationRow) => row.locales.some((locale) => locale.status !== 'DONE');
  const visible = useMemo(() => (filter === 'all' ? rows : rows.filter(needsAttention)), [rows, filter]);
  const attention = rows.filter(needsAttention).length;

  return (
    <section className="admin-card" aria-labelledby="translations-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h2 id="translations-title" className="font-display text-lg font-semibold">
            Automatic translation
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-ink-muted">
            English is the source. Gujarati and Hindi are generated with Google Cloud Translation after every English save. When English changes,
            the previous translation stays on the site until the new one is ready. URLs, emails, phone numbers and codes are never translated.
          </p>
        </div>
        <form action={allAction} className="flex items-center gap-2">
          <button type="submit" disabled={allPending || !configured} className="admin-btn admin-btn-primary whitespace-nowrap">
            {allPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Languages className="size-4" aria-hidden="true" />}
            Translate everything that needs it
          </button>
        </form>
      </div>

      <div className="mx-6 mt-4 rounded-xl border border-line bg-warm-ivory/60 px-4 py-3 text-sm">
        {configured ? (
          <p>
            <strong>Connected</strong> · provider {provider === 'google-v3' ? 'Google Cloud Translation v3 (service account)' : 'Google Cloud Translation v2 (API key)'}
          </p>
        ) : (
          <p className="text-danger [overflow-wrap:anywhere]">
            <strong>Not connected.</strong> {configMessage} Nothing is translated until a server administrator adds the credentials; English is shown
            in the meantime.
          </p>
        )}
      </div>

      <Notice state={allState} />
      <Notice state={rowResult} />

      <div className="flex flex-wrap items-center gap-2 px-6 pt-5">
        {(['attention', 'all'] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cn('rounded-full border px-3 py-1 text-xs font-semibold', filter === key ? 'border-ink bg-ink text-paper' : 'border-line text-ink-muted')}
          >
            {key === 'attention' ? `Needs attention (${attention})` : `All content (${rows.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-muted">Everything is translated and up to date.</p>
      ) : (
        <div className="overflow-x-auto px-2 pb-4 pt-3">
          <table className="admin-table w-full text-left text-sm md:min-w-[44rem]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3 font-semibold">Content</th>
                <th className="px-3 py-3 font-semibold">ગુજરાતી</th>
                <th className="px-3 py-3 font-semibold">हिन्दी</th>
                <th className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={`${row.type}:${row.id}`} className="border-b border-line/60 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{row.title}</p>
                    <p className="text-[11px] text-ink-muted">{row.typeLabel}</p>
                  </td>
                  {row.locales.map((locale) => (
                    <td key={locale.locale} data-label={locale.locale === 'GU' ? 'ગુજરાતી' : 'हिन्दी'} className="px-3 py-3">
                      <span className={cn('inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', STATUS_STYLE[locale.status])}>
                        {STATUS_LABEL[locale.status] ?? locale.status}
                      </span>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {locale.translatedAt ? `${new Date(locale.translatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Never translated'}
                        {locale.provider ? ` · ${locale.provider}` : ''}
                        {locale.attempts ? ` · ${locale.attempts} run${locale.attempts === 1 ? '' : 's'}` : ''}
                      </p>
                      {locale.hasLegacyBackup ? <p className="text-[11px] text-ink-muted">Hand-written version backed up</p> : null}
                      {locale.lastError && locale.status !== 'DONE' ? <p className="mt-1 max-w-64 text-[11px] text-danger">{locale.lastError}</p> : null}
                    </td>
                  ))}
                  <td className="px-4 py-3">{configured ? <RegenerateButton type={row.type} id={row.id} title={row.title} onResult={setRowResult} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
