import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';
import { Breadcrumbs, type Crumb } from './breadcrumbs';

interface PageHeroProps {
  locale: string;
  homeLabel: string;
  breadcrumbLabel: string;
  crumbs: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  accent?: ReactNode;
  intro?: ReactNode;
  /** Metadata row below the intro (dates, counts, etc.). */
  meta?: ReactNode;
  /** Right-hand visual (desktop) shown below the text on mobile. */
  aside?: ReactNode;
  motif?: 'atom' | 'rings' | 'meridian' | 'none';
  tone?: 'dark' | 'light';
  children?: ReactNode;
  className?: string;
}

/**
 * Shared hero for inner pages. Dark by default so the fixed header overlays
 * it; `data-mx-hero` tells the header which tone to adopt while overlapping.
 */
export function PageHero({
  locale,
  homeLabel,
  breadcrumbLabel,
  crumbs,
  eyebrow,
  title,
  accent,
  intro,
  meta,
  aside,
  motif = 'rings',
  tone = 'dark',
  children,
  className,
}: PageHeroProps) {
  const dark = tone === 'dark';
  return (
    <header
      data-mx-hero={tone}
      className={cn(
        'relative isolate overflow-hidden',
        dark ? 'mx-surface-dark' : 'mx-surface-ivory',
        className,
      )}
    >
      {dark ? (
        <>
          <div aria-hidden="true" className="mx-atmosphere pointer-events-none absolute inset-0 -z-10" />
          <div aria-hidden="true" className="mx-starfield pointer-events-none absolute inset-0 -z-10 opacity-60" />
        </>
      ) : (
        <div aria-hidden="true" className="mx-gridlines pointer-events-none absolute inset-0 -z-10 opacity-60" />
      )}
      {motif !== 'none' && !aside ? (
        <OrbitMotif
          variant={motif}
          className={cn(
            'pointer-events-none absolute -right-24 top-1/2 -z-10 hidden w-[34rem] -translate-y-1/3 md:block lg:-right-10 lg:w-[40rem]',
            dark ? 'text-(--mx-ivory) opacity-70' : 'text-(--mx-ink) opacity-40',
          )}
        />
      ) : null}

      <div className="mx-container mx-hero-offset pb-14 sm:pb-20 lg:pb-24">
        <Breadcrumbs
          homeHref={`/${locale}`}
          homeLabel={homeLabel}
          ariaLabel={breadcrumbLabel}
          items={crumbs}
        />
        <div
          className={cn(
            'mt-10 grid gap-12 lg:mt-14',
            Boolean(aside) && 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16',
          )}
        >
          <div className="min-w-0">
            {eyebrow ? <p className="mx-eyebrow">{eyebrow}</p> : null}
            <h1 className={cn('mx-h1 max-w-[20ch]', eyebrow && 'mt-5')}>
              {title}
              {accent ? (
                <>
                  {' '}
                  <span className="mx-serif-accent">{accent}</span>
                </>
              ) : null}
            </h1>
            {intro ? <div className="mx-lede mt-6 max-w-2xl">{intro}</div> : null}
            {meta ? <div className="mt-8">{meta}</div> : null}
            {children}
          </div>
          {aside ? <div className="min-w-0">{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}
