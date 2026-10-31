'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Check, Inbox, Search, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminActionState } from '@/lib/admin-payload';
import { updateRegistrationStatusAction } from '@/server/actions/admin-registrations';

const initialState: AdminActionState = { status: 'idle' };

export interface RegistrationRow {
  id: string;
  eventTitle: string;
  eventStartAt: string;
  eventName?: string;
  name: string;
  email: string;
  phone: string;
  participants: number;
  notes: string;
  locale: string;
  status: string;
  createdAt: string;
}

function statusClass(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800';
    case 'WAITLISTED':
      return 'border-amber-600/25 bg-amber-500/10 text-amber-800';
    case 'CANCELLED':
      return 'border-line bg-warm-ivory text-ink-muted';
    default:
      return 'border-saffron/40 bg-saffron-light text-saffron-dark';
  }
}

export default function RegistrationBoard({ registrations }: { registrations: RegistrationRow[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [state, action, pending] = useActionState(updateRegistrationStatusAction, initialState);

  useEffect(() => {
    if (state.status === 'success') {
      const timer = window.setTimeout(() => window.location.reload(), 600);
      return () => window.clearTimeout(timer);
    }
  }, [state.status]);

  const filtered = registrations.filter((row) => {
    if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.eventTitle.toLowerCase().includes(q)
    );
  });

  const csvHref = useMemo(() => {
    const header = ['Event', 'EventStart', 'Name', 'Email', 'Phone', 'Participants', 'Status', 'Locale', 'Notes'];
    const lines = registrations.map((row) =>
      [row.eventTitle, row.eventStartAt, row.name, row.email, row.phone, row.participants, row.status, row.locale, row.notes.replace(/\s+/g, ' ')]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );
    return `data:text/csv;charset=utf-8,${encodeURIComponent([header.join(','), ...lines].join('\n'))}`;
  }, [registrations]);

  const statusButtons = ['ALL', 'NEW', 'CONFIRMED', 'WAITLISTED', 'CANCELLED'];

  return (
    <section className="admin-card">
      {state.status === 'error' && state.message ? (
        <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Registrations</h2>
          <span className="rounded-full bg-warm-ivory px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
            {filtered.length}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {statusButtons.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                  statusFilter === status ? 'border-ink bg-ink text-paper' : 'border-line text-ink-muted hover:border-ink/40',
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={csvHref} download="registrations.csv" className="admin-btn admin-btn-outline !py-1.5 !text-[11px]">
            Export CSV
          </a>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search person or event…"
              className="admin-input !w-56 !py-1.5 !pl-9 max-sm:!w-full"
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Inbox className="mx-auto size-8 text-stone" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink-muted">No registrations yet. They appear when visitors sign up for events.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((row) => (
            <li key={row.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Ticket className="size-3.5 text-stone" aria-hidden="true" />
                    {row.eventTitle}
                  </span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass(row.status))}>
                    {row.status}
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  {row.name} · <span className="text-ink-muted">{row.email}</span>
                  {row.phone ? <span className="text-ink-muted"> · {row.phone}</span> : null}
                  {row.participants > 1 ? <span className="text-ink-muted"> · {row.participants} people</span> : null}
                </p>
                {row.notes ? <p className="mt-1 text-[12px] text-ink-soft">Notes: {row.notes}</p> : null}
                <p className="mt-1 text-[11px] text-ink-muted">
                  Event on {row.eventStartAt ? new Date(row.eventStartAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—'} · signed up {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-1.5 max-sm:justify-end">
                {(['CONFIRMED', 'WAITLISTED', 'CANCELLED'] as const).map((status) => (
                  <form key={status} action={action}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={pending || row.status === status}
                      className={cn(
                        'admin-btn admin-btn-ghost !py-1.5 !text-[11px]',
                        status === 'CONFIRMED' && '!text-emerald-800',
                        status === 'CANCELLED' && '!text-danger',
                      )}
                    >
                      <Check className="hidden" aria-hidden="true" />
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
