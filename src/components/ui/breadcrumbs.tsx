import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  locale: LocaleCode;
  homeLabel: string;
  ariaLabel: string;
  items: BreadcrumbItem[];
  light?: boolean;
}

export function Breadcrumbs({
  locale,
  homeLabel,
  ariaLabel,
  items,
  light = false,
}: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className="py-4">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-1.5 text-xs',
          light ? 'text-paper/55' : 'text-ink-muted',
        )}
      >
        <li>
          <Link
            href={`/${locale}`}
            className={cn('transition-colors', light ? 'hover:text-paper' : 'hover:text-teal-dark')}
          >
            {homeLabel}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <ChevronRight className="size-3 opacity-50" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'transition-colors',
                  light ? 'hover:text-paper' : 'hover:text-teal-dark',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={cn('font-semibold', light ? 'text-paper' : 'text-ink')}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
