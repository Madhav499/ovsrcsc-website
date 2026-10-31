'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { registerForEventAction, type PublicFormState } from '@/server/actions/public';

interface EventRegistrationFormProps {
  eventId: string;
  locale: LocaleCode;
  dict: Dictionary;
}

const initialState: PublicFormState = { status: 'idle' };

export function EventRegistrationForm({ eventId, locale, dict }: EventRegistrationFormProps) {
  const [state, formAction, pending] = useActionState(registerForEventAction, initialState);
  const startedAt = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-success/25 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
        <h3 className="mt-3 font-display text-xl font-semibold">{dict['events.registeredTitle']}</h3>
        <p className="mt-2 text-sm text-ink-soft">{state.message || dict['events.registeredBody']}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-outline mt-5"
        >
          {dict['events.registerAnother']}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formStartedAt" ref={startedAt} />
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="event-website">Website</label>
        <input id="event-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="registration-name" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.name']} *
          </label>
          <input
            id="registration-name"
            name="name"
            required
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="registration-email" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.email']} *
          </label>
          <input
            id="registration-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          />
          {state.fieldErrors?.email ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="registration-phone" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.phone']} *
          </label>
          <input
            id="registration-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          />
          {state.fieldErrors?.phone ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.phone}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="registration-participants" className="mb-1.5 block text-sm font-semibold">
            {dict['events.participants']} *
          </label>
          <select
            id="registration-participants"
            name="participants"
            defaultValue="1"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="registration-notes" className="mb-1.5 block text-sm font-semibold">
          {dict['events.notes']} <span className="font-normal text-ink-muted">({dict['forms.optional']})</span>
        </label>
        <textarea
          id="registration-notes"
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-sm"
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 size-4 rounded border-line" />
        <span>{dict['contact.consent']}</span>
      </label>
      {state.fieldErrors?.consent ? (
        <p className="text-xs text-danger">{state.fieldErrors.consent}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {pending ? dict['common.submitting'] : dict['common.submit']}
      </button>
    </form>
  );
}
