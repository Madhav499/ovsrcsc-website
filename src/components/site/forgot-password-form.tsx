'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { forgotPasswordAction, type AuthFormState } from '@/server/actions/auth';
import type { Dictionary } from '@/i18n';

const initialState: AuthFormState = { status: 'idle' };

export function ForgotPasswordForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'success' ? (
        <div className="rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
          <p>{state.message}</p>
          <Link href="/admin/login" className="mt-2 inline-block font-bold underline">
            {dict['auth.returnToSignIn']}
          </Link>
        </div>
      ) : null}
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold">
          {dict['auth.emailLabel']}
        </label>
        <input
          id="forgot-email"
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

      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="size-4" aria-hidden="true" />
        )}
        {pending ? dict['auth.sending'] : dict['auth.sendLink']}
      </button>
      <p className="text-center text-xs text-ink-muted">
        <Link href="/admin/login" className="font-bold text-brass-dark hover:underline">
          {dict['auth.backToSignIn']}
        </Link>
      </p>
    </form>
  );
}
