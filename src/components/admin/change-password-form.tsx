'use client';

import { useActionState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { changePasswordAction, type AuthFormState } from '@/server/actions/auth';

const initialState: AuthFormState = { status: 'idle' };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'success' ? (
        <p role="status" className="rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="current-password" className="mb-1.5 block text-sm font-semibold">
          Current password
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"
        />
        {state.fieldErrors?.currentPassword ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.currentPassword}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"
        />
        <p className="mt-1 text-xs text-ink-muted">
          At least 12 characters, using three of: lowercase, uppercase, numbers, symbols.
        </p>
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-semibold">
          Confirm new password
        </label>
        <input
          id="confirm-new-password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.confirmPassword}</p>
        ) : null}
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        {pending ? 'Updating…' : 'Change password'}
      </button>
    </form>
  );
}
