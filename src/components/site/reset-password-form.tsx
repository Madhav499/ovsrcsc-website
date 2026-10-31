'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2 } from 'lucide-react';
import { resetPasswordAction, type AuthFormState } from '@/server/actions/auth';
import type { Dictionary } from '@/i18n';

const initialState: AuthFormState = { status: 'idle' };

export function ResetPasswordForm({ token, dict }: { token: string; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (state.status === 'success') {
    return (
      <div className="rounded-xl border border-success/25 bg-success/5 px-5 py-6 text-center text-sm text-success">
        <p className="font-semibold">{state.message}</p>
        <Link href="/admin/login?reset=1" className="btn btn-primary mt-5">
          {dict['auth.signIn']}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="reset-password" className="mb-1.5 block text-sm font-semibold">
          {dict['auth.passwordLabel']}
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
        />
        <p className="mt-1 text-xs text-ink-muted">{dict['auth.passwordHint']}</p>
      </div>
      <div>
        <label htmlFor="reset-confirm" className="mb-1.5 block text-sm font-semibold">
          {dict['auth.confirmLabel']}
        </label>
        <input
          id="reset-confirm"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        {pending ? dict['auth.updating'] : dict['auth.setPassword']}
      </button>
    </form>
  );
}
