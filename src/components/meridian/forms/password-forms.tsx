'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import { forgotPasswordAction, resetPasswordAction, type AuthFormState } from '@/server/actions/auth';
import type { Dictionary } from '@/i18n';
import { Field, FormAlert, fieldA11y } from './field';

const initialState: AuthFormState = { status: 'idle' };

/** Staff password-reset request. Same action, field name and links as before. */
export function ForgotPasswordForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);
  const emailError = state.fieldErrors?.email;

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === 'success' ? (
        <FormAlert tone="success">
          <p>{state.message}</p>
          <Link href="/admin/login" className="mt-2 inline-block font-bold underline">
            {dict['auth.returnToSignIn']}
          </Link>
        </FormAlert>
      ) : null}
      {state.status === 'error' && state.message ? <FormAlert tone="error">{state.message}</FormAlert> : null}

      <Field id="forgot-email" label={dict['auth.emailLabel']} error={emailError}>
        <input
          {...fieldA11y('forgot-email', emailError)}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mx-input"
        />
      </Field>

      <button type="submit" disabled={pending} className="mx-btn mx-btn-ink mx-btn-block">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
        {pending ? dict['auth.sending'] : dict['auth.sendLink']}
      </button>
      <p className="text-center text-[0.875rem]">
        <Link href="/admin/login" className="mx-link">
          {dict['auth.backToSignIn']}
        </Link>
      </p>
    </form>
  );
}

/** Staff password reset. Keeps the hidden `token` field and field names unchanged. */
export function ResetPasswordForm({ token, dict }: { token: string; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const confirmError = state.fieldErrors?.confirmPassword;

  if (state.status === 'success') {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">
          <p className="font-semibold">{state.message}</p>
        </FormAlert>
        <Link href="/admin/login?reset=1" className="mx-btn mx-btn-ink mx-btn-block">
          {dict['auth.signIn']}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && state.message ? <FormAlert tone="error">{state.message}</FormAlert> : null}

      <Field id="reset-password" label={dict['auth.passwordLabel']} hint={dict['auth.passwordHint']}>
        <input
          {...fieldA11y('reset-password', undefined, dict['auth.passwordHint'])}
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="mx-input"
        />
      </Field>
      <Field id="reset-confirm" label={dict['auth.confirmLabel']} error={confirmError}>
        <input
          {...fieldA11y('reset-confirm', confirmError)}
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="mx-input"
        />
      </Field>

      <button type="submit" disabled={pending} className="mx-btn mx-btn-ink mx-btn-block">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
        {pending ? dict['auth.updating'] : dict['auth.setPassword']}
      </button>
    </form>
  );
}
