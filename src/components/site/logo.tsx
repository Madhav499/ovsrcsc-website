import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LocaleCode } from '@/lib/constants';

interface LogoProps {
  locale: LocaleCode;
  shortName: string;
  fullName: string;
  light?: boolean;
  className?: string;
}

export function Logo({ locale, shortName, fullName, light = false, className }: LogoProps) {
  return (
    <Link
      href={`/${locale}`}
      className={cn('group flex items-center gap-3', className)}
      aria-label={fullName}
    >
      <span
        className={cn(
          'relative grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-300',
          light
            ? 'border-warm-ivory/20 bg-warm-ivory/8 text-warm-ivory group-hover:border-brass/40 group-hover:bg-brass/15'
            : 'border-carbon bg-carbon text-warm-ivory group-hover:border-graphite group-hover:bg-graphite',
        )}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true" className="size-7.5">
          <ellipse
            cx="20"
            cy="20"
            rx="15"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.55"
            transform="rotate(-28 20 20)"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="15"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            transform="rotate(32 20 20)"
          />
          <circle cx="20" cy="20" r="3.8" fill="#A58B62" />
          <circle cx="32.5" cy="14" r="1.4" fill="currentColor" opacity="0.7" />
        </svg>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-display text-[15px] font-medium leading-tight tracking-[-0.01em]',
            light ? 'text-warm-ivory' : 'text-carbon',
          )}
        >
          {shortName}
        </span>
        <span
          className={cn(
            'mt-0.5 block max-w-[15rem] text-[9.5px] font-semibold uppercase leading-tight tracking-[0.14em]',
            light ? 'text-warm-ivory/50' : 'text-ink-muted',
          )}
        >
          {fullName}
        </span>
      </span>
    </Link>
  );
}
