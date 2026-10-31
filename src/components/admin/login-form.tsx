'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2, LogIn } from 'lucide-react';
import { loginAction, type AuthFormState } from '@/server/actions/auth';

const initialState: AuthFormState = { status: 'idle' };

export function LoginForm({ resetSuccess = false }: { resetSuccess?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {resetSuccess ? (
        <p className="rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
          Your password has been changed. Sign in with your new password.
        </p>
      ) : null}
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-semibold">
            Password
          </label>
          <Link
            href="/en/forgot-password"
            className="text-xs font-bold text-teal-dark hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-4" aria-hidden="true" />
        )}
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
