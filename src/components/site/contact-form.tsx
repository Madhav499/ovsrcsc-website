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
      <div className="rounded-3xl border border-teal-500/30 bg-teal-50/50 p-8 sm:p-12 text-center shadow-xs">
        <CheckCircle2 className="mx-auto size-14 text-teal-600" aria-hidden="true" />
        <h2 className="mt-5 font-display text-2xl font-semibold text-midnight">{dict['contact.successTitle']}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-muted max-w-md mx-auto">
          {state.message || dict['contact.successBody']}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-outline mt-8"
        >
          {dict['contact.sendAnother']}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-3xl border border-line bg-white p-7 sm:p-10 shadow-xs">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formStartedAt" ref={startedAt} />
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h2 className="font-display text-2xl font-semibold text-midnight">{dict['contact.formTitle']}</h2>
      <p className="mt-1.5 text-sm text-slate-muted">{dict['contact.formIntro']}</p>

      {state.status === 'error' && state.message ? (
        <p role="alert" className="mt-5 rounded-2xl border border-red-500/25 bg-red-50/60 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
            {dict['contact.name']} *
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-midnight placeholder:text-slate-muted/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
            {dict['contact.email']} *
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-midnight placeholder:text-slate-muted/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
          />
          {state.fieldErrors?.email ? (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
            {dict['contact.phone']} <span className="font-normal text-slate-muted">({dict['forms.optional']})</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-midnight placeholder:text-slate-muted/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
          />
          {state.fieldErrors?.phone ? (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-type" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
            {dict['contact.enquiryType']} *
          </label>
          <select
            id="contact-type"
            name="type"
            defaultValue="GENERAL"
            className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-midnight focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
          >
            <option value="GENERAL">{dict['contact.type.general']}</option>
            <option value="PROGRAMME">{dict['contact.type.programme']}</option>
            <option value="EVENT">{dict['contact.type.event']}</option>
            <option value="VOLUNTEER">{dict['contact.type.volunteer']}</option>
            <option value="FEEDBACK">{dict['contact.type.feedback']}</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
          {dict['contact.subject']} *
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-midnight placeholder:text-slate-muted/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
        />
        {state.fieldErrors?.subject ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.subject}</p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="mb-2 block text-xs font-bold uppercase tracking-wider text-midnight">
          {dict['contact.message']} *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={6}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-midnight placeholder:text-slate-muted/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 transition-all"
        />
        {state.fieldErrors?.message ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.message}</p>
        ) : null}
      </div>

      <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-slate-muted cursor-pointer">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 rounded border-line text-cyan focus:ring-cyan" />
        <span>{dict['contact.consent']}</span>
      </label>
      {state.fieldErrors?.consent ? (
        <p className="mt-1 text-xs text-red-600">{state.fieldErrors.consent}</p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <button type="submit" disabled={pending} className="btn btn-accent !py-3.5 !px-8 text-xs font-bold uppercase tracking-wider disabled:opacity-60">
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {pending ? dict['common.submitting'] : dict['common.submit']}
        </button>
        <p className="text-xs text-slate-muted/80">{dict['contact.responseNote']}</p>
      </div>
    </form>
  );
}
