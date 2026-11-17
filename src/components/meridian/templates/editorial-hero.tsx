import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/meridian/layout/breadcrumbs';

interface EditorialHeroProps {
  locale: string;
  homeLabel: string;
  breadcrumbLabel: string;
  crumbs: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  lede?: ReactNode;
  /** Running folio items, e.g. section · date · reading time. */
  folio?: ReactNode[];
  /** Full-width figure under the title block (cover photograph). */
  figure?: ReactNode;
  /** Visual placed beside the title on large screens (diagram, motif). */
  aside?: ReactNode;
  surface?: 'stone' | 'ivory' | 'mineral';
  className?: string;
}

/**
 * Light journal-style opener for inner pages: folio, breadcrumbs, a large
 * serif title and a lede, with an optional cover figure. `data-mx-hero`
 * keeps the fixed header legible while it overlaps.
 */
export function EditorialHero({
  locale,
  homeLabel,
  breadcrumbLabel,
  crumbs,
  eyebrow,
  title,
  accent,
  lede,
  folio,
  figure,
  aside,
  surface = 'stone',
  className,
}: EditorialHeroProps) {
  const dark = surface === 'mineral';
  return (
    <header
      data-mx-hero={dark ? 'dark' : 'light'}
      className={cn(
        'mx-grain relative isolate overflow-hidden',
        surface === 'stone' ? 'mx-surface-stone' : surface === 'mineral' ? 'mx-surface-mineral' : 'mx-surface-ivory',
        className,
      )}
    >
      <div className="mx-container mx-hero-offset pb-12 sm:pb-16">
        <Breadcrumbs homeHref={`/${locale}`} homeLabel={homeLabel} ariaLabel={breadcrumbLabel} items={crumbs} />
        <div className={cn('mt-10 grid gap-12 lg:mt-16', Boolean(aside) && 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end lg:gap-16')}>
          <div className="min-w-0">
            {eyebrow ? <p className="mx-eyebrow mx-enter">{eyebrow}</p> : null}
            <h1 className={cn('mx-h1 mx-enter max-w-[18ch]', Boolean(eyebrow) && 'mt-6')} style={{ '--mx-delay': '80ms' } as React.CSSProperties}>
              {title}
              {accent ? (
                <>
                  {' '}
                  <span className="mx-serif-accent text-(--mx-accent)">{accent}</span>
                </>
              ) : null}
            </h1>
            {lede ? (
              <div className="mx-lede mx-enter mt-7 max-w-[38ch]" style={{ '--mx-delay': '180ms' } as React.CSSProperties}>
                {lede}
              </div>
            ) : null}
          </div>
          {aside ? <div className="mx-enter-fade min-w-0">{aside}</div> : null}
        </div>
        {folio?.length ? (
          <div className="mx-folio mx-enter mt-12" style={{ '--mx-delay': '260ms' } as React.CSSProperties}>
            {folio.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
      {figure ? <div className="mx-container pb-0">{figure}</div> : null}
    </header>
  );
}
