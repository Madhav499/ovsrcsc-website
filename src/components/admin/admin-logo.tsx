import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AdminLogo({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href="/admin" className="flex items-center gap-3" aria-label="Website admin dashboard">
      <span
        className={cn(
          'relative grid size-10 shrink-0 place-items-center rounded-full border',
          light ? 'border-paper/25 bg-paper/10 text-paper' : 'border-ink/10 bg-ink text-paper',
        )}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true" className="size-7">
          <ellipse
            cx="20"
            cy="20"
            rx="16"
            ry="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.65"
            transform="rotate(-28 20 20)"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="16"
            ry="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.35"
            transform="rotate(32 20 20)"
          />
          <circle cx="20" cy="20" r="4.1" fill="#F2A63B" />
        </svg>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-display font-semibold leading-tight',
            compact ? 'text-sm' : 'text-base',
            light ? 'text-paper' : 'text-ink',
          )}
        >
          OVSRCSC
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em]',
            light ? 'text-paper/55' : 'text-ink-muted',
          )}
        >
          Website admin
        </span>
      </span>
    </Link>
  );
}
