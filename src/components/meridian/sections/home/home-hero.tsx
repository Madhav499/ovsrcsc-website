import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import type { PublicEvent, PublicNotice } from '@/server/public/queries';
import { AtomStage } from '@/components/meridian/visualizations/atom-stage';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';

interface HomeHeroProps {
  locale: LocaleCode;
  dict: Dictionary;
  nextEvent: PublicEvent | null;
  latestNotice: PublicNotice | null;
}

const delay = (ms: number) => ({ '--mx-delay': `${ms}ms` }) as React.CSSProperties;

export function HomeHero({ locale, dict, nextEvent, latestNotice }: HomeHeroProps) {
  const p = `/${locale}`;
  const ticker = nextEvent
    ? {
        label: dict['mx.home.heroNext'],
        title: nextEvent.title,
        date: formatDate(nextEvent.startAt, locale, { day: 'numeric', month: 'short' }),
        href: `${p}/events/${nextEvent.slug}`,
      }
    : latestNotice
      ? {
          label: dict['mx.home.heroNotice'],
          title: latestNotice.title,
          date: latestNotice.publishAt
            ? formatDate(latestNotice.publishAt, locale, { day: 'numeric', month: 'short' })
            : '',
          href: `${p}/notices/${latestNotice.slug}`,
        }
      : null;

  return (
    <section
      data-mx-hero="dark"
      aria-labelledby="home-hero-title"
      className="mx-surface-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      <div aria-hidden="true" className="mx-atmosphere pointer-events-none absolute inset-0 -z-20" />
      <div aria-hidden="true" className="mx-starfield pointer-events-none absolute inset-0 -z-20 opacity-80" />
      <div aria-hidden="true" className="mx-gridlines pointer-events-none absolute inset-0 -z-20 opacity-40" />

      <div className="mx-container relative flex flex-1 flex-col pb-10 pt-[calc(var(--mx-header-h)+2.5rem)] lg:pt-[calc(var(--mx-header-h)+3rem)]">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-4">
          <div className="relative z-10 min-w-0">
            <p className="mx-eyebrow mx-enter" style={delay(80)}>
              <span className="size-1.5 rounded-full bg-(--mx-amber)" aria-hidden="true" />
              {dict['mx.home.heroEyebrow']}
            </p>
            <h1 id="home-hero-title" className="mx-display mt-7">
              <span className="mx-enter block" style={delay(160)}>
                {dict['mx.home.heroTitle']}
              </span>
              <span className="mx-enter mx-serif-accent block text-(--mx-amber)" style={delay(280)}>
                {dict['mx.home.heroTitleAccent']}
              </span>
            </h1>
            <p className="mx-body-lg mx-enter mt-8 max-w-[34rem]" style={delay(420)}>
              {dict['home.intro']}
            </p>
            <div className="mx-enter mt-10 flex flex-wrap gap-3" style={delay(540)}>
              <Link href={`${p}/projects`} className="mx-btn mx-btn-primary">
                {dict['home.ctaPrimary']}
                <ArrowRight className="mx-btn-icon" aria-hidden="true" />
              </Link>
              <Link href={`${p}/contact`} className="mx-btn mx-btn-ghost">
                {dict['home.ctaSecondary']}
              </Link>
            </div>
            <p className="mx-enter mt-10 flex max-w-md items-start gap-3 text-[0.8125rem] leading-relaxed text-(--mx-fg-3)" style={delay(680)}>
              <Award className="mt-0.5 size-4 shrink-0 text-(--mx-amber)" aria-hidden="true" />
              {dict['mx.home.heroAward']}
            </p>
          </div>

          <div className="mx-enter-fade pointer-events-none absolute -right-36 -top-6 -z-10 aspect-square w-[22rem] opacity-[0.22] sm:-right-28 sm:top-24 sm:w-[30rem] sm:opacity-40 lg:pointer-events-auto lg:relative lg:right-auto lg:top-auto lg:z-0 lg:w-full lg:max-w-[40rem] lg:justify-self-end lg:opacity-100" style={delay(200)}>
            <AtomStage className="size-full" />
          </div>
        </div>

        {/* Instrument strip */}
        <div className="mx-enter mt-12 grid gap-6 border-t border-(--mx-line) pt-6 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto] lg:items-center lg:gap-10" style={delay(820)}>
          <div className="flex items-center gap-4">
            <span className="mx-scroll-cue hidden sm:block" aria-hidden="true" />
            <div>
              <p className="mx-mono-label">{dict['mx.home.heroCoordinates']}</p>
              <a href="#home-intro" className="mt-1 inline-flex min-h-8 items-center text-[0.875rem] font-semibold text-(--mx-fg-2) hover:text-(--mx-fg)">
                {dict['mx.home.heroScroll']}
              </a>
            </div>
          </div>

          {ticker ? (
            <Link href={ticker.href} className="group flex min-w-0 items-center gap-4 rounded-(--mx-radius-sm) py-1">
              <span className="relative flex size-2.5 shrink-0">
                <span className="mx-pulse absolute inset-0 rounded-full bg-(--mx-cyan)" aria-hidden="true" />
                <span className="relative size-2.5 rounded-full bg-(--mx-cyan)" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="mx-mono-label block">
                  {ticker.label}
                  {ticker.date ? ` · ${ticker.date}` : ''}
                </span>
                <span className="mt-1 block truncate font-semibold text-(--mx-fg) group-hover:text-(--mx-cyan)">
                  {ticker.title}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-(--mx-fg-3) transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ) : (
            <span className="hidden lg:block" />
          )}

          <figure className="hidden items-center gap-4 lg:flex">
            <div className="mx-plate relative h-16 w-24 overflow-hidden">
              <Image src={BRAND_PHOTOS.telescopes} alt="" fill sizes="96px" className="object-cover" placeholder="blur" />
            </div>
            <figcaption className="max-w-[12rem] text-[0.75rem] leading-snug text-(--mx-fg-3)">
              {dict['mx.home.heroPlateCaption']}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
