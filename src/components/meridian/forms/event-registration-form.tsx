'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { registerForEventAction, type PublicFormState } from '@/server/actions/public';
import { Field, FormAlert, Honeypot, fieldA11y } from './field';

interface EventRegistrationFormProps {
  eventId: string;
  locale: LocaleCode;
  dict: Dictionary;
}

const initialState: PublicFormState = { status: 'idle' };

/** Event registration — same fields and action contract as before; new presentation only. */
export function EventRegistrationForm({ eventId, locale, dict }: EventRegistrationFormProps) {
  const [state, formAction, pending] = useActionState(registerForEventAction, initialState);
  const startedAt = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  if (state.status === 'success') {
    return (
      <div role="status" className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-(--mx-accent)" aria-hidden="true" />
        <h3 className="mx-h4 mt-4">{dict['events.registeredTitle']}</h3>
        <p className="mt-2 text-[0.9375rem] text-(--mx-fg-2)">{state.message || dict['events.registeredBody']}</p>
        <button type="button" onClick={() => window.location.reload()} className="mx-btn mx-btn-ghost mx-btn-sm mt-6">
          {dict['events.registerAnother']}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="relative grid gap-5">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formStartedAt" ref={startedAt} />
      <Honeypot id="event-website" />

      {state.status === 'error' && state.message ? <FormAlert tone="error">{state.message}</FormAlert> : null}

      <Field id="registration-name" label={dict['contact.name']} required error={errors.name}>
        <input
          {...fieldA11y('registration-name', errors.name)}
          name="name"
          required
          autoComplete="name"
          className="mx-input"
        />
      </Field>
      <Field id="registration-email" label={dict['contact.email']} required error={errors.email}>
        <input
          {...fieldA11y('registration-email', errors.email)}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mx-input"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <Field id="registration-phone" label={dict['contact.phone']} required error={errors.phone}>
          <input
            {...fieldA11y('registration-phone', errors.phone)}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            className="mx-input"
          />
        </Field>
        <Field id="registration-participants" label={dict['events.participants']} required error={errors.participants}>
          <select
            {...fieldA11y('registration-participants', errors.participants)}
            name="participants"
            defaultValue="1"
            className="mx-input"
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="registration-notes" label={dict['events.notes']} optionalLabel={dict['forms.optional']}>
        <textarea id="registration-notes" name="notes" rows={3} className="mx-input !min-h-24" />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-(--mx-fg-2)">
          <input
            type="checkbox"
            name="consent"
            required
            className="mx-checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'registration-consent-error' : undefined}
          />
          <span>{dict['contact.consent']}</span>
        </label>
        {errors.consent ? (
          <p id="registration-consent-error" className="mx-field-error">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className="mx-btn mx-btn-primary mx-btn-block">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        {pending ? dict['common.submitting'] : dict['common.submit']}
      </button>
    </form>
  );
}
