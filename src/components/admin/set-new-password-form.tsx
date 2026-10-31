'use client';

import { useActionState, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import {
  setNewPasswordAction,
  type AuthFormState,
} from '@/server/actions/auth';

const initialState: AuthFormState = { status: 'idle' };

function PasswordVisibilityToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={checked ? 'Hide password' : 'Show password'}
      className="absolute inset-y-0 right-3 flex items-center px-3 text-ink-muted hover:text-ink"
    >
      {checked ? <span className="size-4">🙈</span> : <span className="size-4">👁️</span>}
    </button>
  );
}

export function SetNewPasswordForm() {
  const [state, formAction, pending] = useActionState(setNewPasswordAction, initialState);
  const [showTemporary, setShowTemporary] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      {state.fieldErrors ? (
        <ul className="space-y-1 text-xs text-danger">
          {Object.entries(state.fieldErrors).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <label htmlFor="temporary-password" className="mb-1.5 block text-sm font-semibold">
          Temporary password
        </label>
        <input
          id="temporary-password"
          name="currentPassword"
          type={showTemporary ? 'text' : 'password'}
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm"
        />
        <PasswordVisibilityToggle
          checked={showTemporary}
          onChange={() => setShowTemporary((previous) => !previous)}
        />
        {state.fieldErrors?.currentPassword ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.currentPassword}</p>
        ) : null}
      </div>

      <div className="relative">
        <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type={showNew ? 'text' : 'password'}
          required
          minLength={12}
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm"
        />
        <PasswordVisibilityToggle checked={showNew} onChange={() => setShowNew((previous) => !previous)} />
        <p className="mt-1 text-xs text-ink-muted">
          At least 12 characters, using three of: lowercase, uppercase, numbers, symbols.
        </p>
        {state.fieldErrors?.password ? (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="relative">
        <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-semibold">
          Confirm new password
        </label>
        <input
          id="confirm-new-password"
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          required
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pr-10 text-sm"
        />
        <PasswordVisibilityToggle
          checked={showConfirm}
          onChange={() => setShowConfirm((previous) => !previous)}
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
        {pending ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  );
}
