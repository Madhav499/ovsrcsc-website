'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { submitEnquiryAction, type PublicFormState } from '@/server/actions/public';

interface ContactFormProps {
  locale: LocaleCode;
  dict: Dictionary;
}

const initialState: PublicFormState = { status: 'idle' };

export function ContactForm({ locale, dict }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitEnquiryAction, initialState);
  const startedAt = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  if (state.status === 'success') {
    return (
      <div className="card-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-semibold">{dict['contact.successTitle']}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {state.message || dict['contact.successBody']}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-outline mt-6"
        >
          {dict['contact.sendAnother']}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-surface p-6 sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formStartedAt" ref={startedAt} />
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h2 className="font-display text-2xl font-semibold">{dict['contact.formTitle']}</h2>
      <p className="mt-1 text-sm text-ink-muted">{dict['contact.formIntro']}</p>

      {state.status === 'error' && state.message ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.name']} *
          </label>
          <input
            id="contact-name"
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
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.email']} *
          </label>
          <input
            id="contact-email"
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
        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.phone']} <span className="font-normal text-ink-muted">({dict['forms.optional']})</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          />
          {state.fieldErrors?.phone ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.phone}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-type" className="mb-1.5 block text-sm font-semibold">
            {dict['contact.enquiryType']} *
          </label>
          <select
            id="contact-type"
            name="type"
            defaultValue="GENERAL"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
          >
            <option value="GENERAL">{dict['contact.type.general']}</option>
            <option value="PROGRAMME">{dict['contact.type.programme']}</option>
            <option value="EVENT">{dict['contact.type.event']}</option>
            <option value="VOLUNTEER">{dict['contact.type.volunteer']}</option>
            <option value="FEEDBACK">{dict['contact.type.feedback']}</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold">
          {dict['contact.subject']} *
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
        />
        {state.fieldErrors?.subject ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.subject}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold">
          {dict['contact.message']} *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={6}
          className="w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-sm"
        />
        {state.fieldErrors?.message ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.message}</p>
        ) : null}
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 size-4 rounded border-line" />
        <span>{dict['contact.consent']}</span>
      </label>
      {state.fieldErrors?.consent ? (
        <p className="mt-1 text-xs text-danger">{state.fieldErrors.consent}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full disabled:opacity-60 sm:w-auto">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {pending ? dict['common.submitting'] : dict['common.submit']}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-ink-muted">{dict['contact.responseNote']}</p>
    </form>
  );
}
