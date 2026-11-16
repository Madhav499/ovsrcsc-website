import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  homeHref: string;
  homeLabel: string;
  ariaLabel: string;
  items: Crumb[];
  className?: string;
}

export function Breadcrumbs({ homeHref, homeLabel, ariaLabel, items, className }: BreadcrumbsProps) {
  const all: Crumb[] = [{ label: homeLabel, href: homeHref }, ...items];
  return (
    <nav aria-label={ariaLabel} className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-medium text-(--mx-fg-3)">
        {all.map((item, index) => {
          const last = index === all.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="truncate transition-colors duration-200 hover:text-(--mx-fg)"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="max-w-[28ch] truncate text-(--mx-fg-2)">
                  {item.label}
                </span>
              )}
              {!last ? (
                <span aria-hidden="true" className="h-px w-3 bg-current opacity-40" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
