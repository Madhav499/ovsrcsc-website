import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint + inline error. Wire the control with `fieldA11y(id, error, hint)`. */
export function Field({ id, label, required, optionalLabel, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mx-label">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-(--mx-accent-2)">
            {' '}*
          </span>
        ) : optionalLabel ? (
          <span className="mx-label-hint"> ({optionalLabel})</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-(--mx-fg-3)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mx-field-error flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** ARIA props for a control rendered inside <Field>. */
export function fieldA11y(id: string, error?: string, hint?: string) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ');
  return {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy || undefined,
  };
}

export function FormAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mx-alert', tone === 'error' ? 'mx-alert-error' : 'mx-alert-success')}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

/** Visually hidden honeypot used by the existing bot check in server/actions/public.ts. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
