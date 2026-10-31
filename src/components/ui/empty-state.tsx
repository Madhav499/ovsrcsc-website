import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, children, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-ink/15 bg-paper/60 px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-sky text-teal">
          {icon}
        </span>
      ) : null}
      {title ? <p className="font-display text-lg font-semibold text-ink">{title}</p> : null}
      <div className="mt-1 text-sm text-ink-muted">{children}</div>
    </div>
  );
}
