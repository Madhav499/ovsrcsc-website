import type { ReactNode } from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

interface EmptyStateProps {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Calm, on-brand empty state: a quiet orbit diagram rather than a sad icon. */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-(--mx-radius-md) border border-dashed border-(--mx-line-strong) px-6 py-12 sm:px-12 sm:py-16',
        className,
      )}
    >
      <OrbitMotif
        variant="rings"
        animated={false}
        className="pointer-events-none absolute -right-16 -top-16 w-64 text-(--mx-fg-3) opacity-40"
      />
      <div className="relative max-w-lg">
        <p className="mx-h3">{title}</p>
        {body ? <div className="mt-3 text-(--mx-fg-2)">{body}</div> : null}
        {action ? <div className="mt-7 flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

/** Shown when CMS content falls back to the English translation. */
export function FallbackNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="note" className={cn('mx-alert mx-alert-info', className)}>
      <Languages className="mt-0.5 size-4 shrink-0 text-(--mx-accent-2)" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
