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
          'relative grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-300',
          light
            ? 'border-cyan/30 bg-cosmic/70 text-warm-ivory group-hover:border-cyan group-hover:shadow-[0_0_12px_rgba(82,213,232,0.4)]'
            : 'border-midnight bg-midnight text-warm-ivory group-hover:border-cosmic group-hover:shadow-[0_0_14px_rgba(82,213,232,0.3)]',
        )}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true" className="size-7.5 transition-transform duration-700 ease-out group-hover:rotate-45">
          <ellipse
            cx="20"
            cy="20"
            rx="15"
            ry="6"
            fill="none"
            stroke="#52D5E8"
            strokeWidth="1.2"
            opacity="0.65"
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
            opacity="0.35"
            transform="rotate(32 20 20)"
          />
          <circle cx="20" cy="20" r="3.8" fill="#E9A94B" />
          <circle cx="32.5" cy="14" r="1.6" fill="#52D5E8" opacity="0.9" />
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
