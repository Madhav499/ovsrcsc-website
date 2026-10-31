'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check, Inbox, Mail, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminActionState } from '@/lib/admin-payload';
import { updateEnquiryStatusAction } from '@/server/actions/admin-enquiries';

const initialState: AdminActionState = { status: 'idle' };

export interface EnquiryRow {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  locale: string;
  status: string;
  section: string;
  createdAt: string;
}

function statusClass(status: string): string {
  switch (status) {
    case 'RESOLVED':
      return 'border-emerald-600/25 bg-emerald-500/10 text-emerald-800';
    case 'IN_PROGRESS':
      return 'border-amber-600/25 bg-amber-500/10 text-amber-800';
    case 'SPAM':
      return 'border-danger/25 bg-danger/10 text-danger';
    default:
      return 'border-saffron/40 bg-saffron-light text-saffron-dark';
  }
}

export default function EnquiryBoard({ enquiries }: { enquiries: EnquiryRow[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [state, action, pending] = useActionState(updateEnquiryStatusAction, initialState);

  useEffect(() => {
    if (state.status === 'success') {
      const timer = window.setTimeout(() => window.location.reload(), 600);
      return () => window.clearTimeout(timer);
    }
  }, [state.status]);

  const filtered = enquiries.filter((enquiry) => {
    if (statusFilter !== 'ALL' && enquiry.status !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      enquiry.name.toLowerCase().includes(q) ||
      enquiry.email.toLowerCase().includes(q) ||
      enquiry.subject.toLowerCase().includes(q)
    );
  });

  const statusButtons = ['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'];

  return (
    <section className="admin-card">
      {state.status === 'error' && state.message ? (
        <p role="alert" className="mx-6 mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Enquiries</h2>
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
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email…"
            className="admin-input !w-56 !py-1.5 !pl-9 max-sm:!w-full"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Inbox className="mx-auto size-8 text-stone" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink-muted">
            No enquiries here yet. New messages from the contact form will appear automatically.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((enquiry) => (
            <li key={enquiry.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  <span>{enquiry.subject}</span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusClass(enquiry.status))}>
                    {enquiry.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    {enquiry.type}
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  {enquiry.name} · <span className="text-ink-muted">{enquiry.email}</span>
                  {enquiry.phone ? <span className="text-ink-muted"> · {enquiry.phone}</span> : null}
                  {enquiry.locale !== 'en' ? <span className="text-ink-muted"> · {enquiry.locale.toUpperCase()}</span> : null}
                </p>
                <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-soft">{enquiry.message}</p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {new Date(enquiry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                  {enquiry.section ? ` · ${enquiry.section}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-1.5 max-sm:justify-end">
                <form action={action}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <input type="hidden" name="status" value="IN_PROGRESS" />
                  <button type="submit" disabled={pending} className="admin-btn admin-btn-ghost !py-1.5 !text-[11px]">
                    <Send className="size-3.5" aria-hidden="true" />
                    In progress
                  </button>
                </form>
                <form action={action}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <input type="hidden" name="status" value="RESOLVED" />
                  <button type="submit" disabled={pending} className="admin-btn admin-btn-ghost !py-1.5 !text-[11px] !text-emerald-800">
                    <Check className="size-3.5" aria-hidden="true" />
                    Resolved
                  </button>
                </form>
                <form action={action}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <input type="hidden" name="status" value="SPAM" />
                  <button type="submit" disabled={pending} className="admin-btn admin-btn-ghost !py-1.5 !text-[11px] !text-danger">
                    <Mail className="size-3.5" aria-hidden="true" />
                    Spam
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
