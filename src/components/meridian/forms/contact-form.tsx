'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { submitEnquiryAction, type PublicFormState } from '@/server/actions/public';
import { Field, FormAlert, Honeypot, fieldA11y } from './field';

interface ContactFormProps {
  locale: LocaleCode;
  dict: Dictionary;
}

const initialState: PublicFormState = { status: 'idle' };

/** Enquiry form — identical field names and action contract; new MERIDIAN presentation. */
export function ContactForm({ locale, dict }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitEnquiryAction, initialState);
  const startedAt = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === 'success') successRef.current?.focus();
  }, [state.status]);

  if (state.status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="mx-surface-white rounded-(--mx-radius-md) p-8 text-center outline-none sm:p-12"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-(--mx-success-soft)">
          <CheckCircle2 className="size-8 text-(--mx-success)" aria-hidden="true" />
        </span>
        <h2 className="mx-h3 mt-6">{dict['contact.successTitle']}</h2>
        <p className="mx-auto mt-3 max-w-md text-(--mx-fg-2)">{state.message || dict['contact.successBody']}</p>
        <button type="button" onClick={() => window.location.reload()} className="mx-btn mx-btn-ghost mt-8">
          {dict['contact.sendAnother']}
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mx-surface-white relative rounded-(--mx-radius-md) p-6 shadow-[var(--mx-shadow-sm)] sm:p-10"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formStartedAt" ref={startedAt} />
      <Honeypot id="contact-website" />

      <h2 className="mx-h3">{dict['contact.formTitle']}</h2>
      <p className="mt-2 text-[0.9375rem] text-(--mx-fg-3)">{dict['contact.formIntro']}</p>

      {state.status === 'error' && state.message ? (
        <div className="mt-6">
          <FormAlert tone="error">{state.message}</FormAlert>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label={dict['contact.name']} required error={errors.name}>
          <input {...fieldA11y('contact-name', errors.name)} name="name" required autoComplete="name" className="mx-input" />
        </Field>
        <Field id="contact-email" label={dict['contact.email']} required error={errors.email}>
          <input
            {...fieldA11y('contact-email', errors.email)}
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mx-input"
          />
        </Field>
        <Field id="contact-phone" label={dict['contact.phone']} optionalLabel={dict['forms.optional']} error={errors.phone}>
          <input
            {...fieldA11y('contact-phone', errors.phone)}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="mx-input"
          />
        </Field>
        <Field id="contact-type" label={dict['contact.enquiryType']} required>
          <select id="contact-type" name="type" defaultValue="GENERAL" className="mx-input">
            <option value="GENERAL">{dict['contact.type.general']}</option>
            <option value="PROGRAMME">{dict['contact.type.programme']}</option>
            <option value="EVENT">{dict['contact.type.event']}</option>
            <option value="VOLUNTEER">{dict['contact.type.volunteer']}</option>
            <option value="FEEDBACK">{dict['contact.type.feedback']}</option>
          </select>
        </Field>
        <Field id="contact-subject" label={dict['contact.subject']} required error={errors.subject} className="sm:col-span-2">
          <input {...fieldA11y('contact-subject', errors.subject)} name="subject" required className="mx-input" />
        </Field>
        <Field id="contact-message" label={dict['contact.message']} required error={errors.message} className="sm:col-span-2">
          <textarea
            {...fieldA11y('contact-message', errors.message)}
            name="message"
            required
            minLength={10}
            rows={6}
            className="mx-input"
          />
        </Field>
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-(--mx-fg-2)">
          <input
            type="checkbox"
            name="consent"
            required
            className="mx-checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
          />
          <span>{dict['contact.consent']}</span>
        </label>
        {errors.consent ? (
          <p id="contact-consent-error" className="mx-field-error">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-(--mx-line) pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={pending} className="mx-btn mx-btn-primary">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {pending ? dict['common.submitting'] : dict['common.submit']}
        </button>
        <p className="max-w-sm text-[0.8125rem] text-(--mx-fg-3)">{dict['contact.responseNote']}</p>
      </div>
    </form>
  );
}
