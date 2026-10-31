import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  Award,
  BookOpen,
  CalendarDays,
  Clock,
  FlaskConical,
  MapPin,
  Microscope,
  Pin,
  Telescope,
  Users,
} from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import { INSTITUTION, type LocaleCode } from '@/lib/constants';
import { formatDate, formatEventRange } from '@/lib/dates';
import { getSiteSettings } from '@/server/services/settings';
import {
  getActiveNotices,
  getGalleryHighlights,
  getUpcomingEvents,
} from '@/server/public/queries';
import { getFeaturedProgrammes } from '@/server/services/pages';
import { AppImage } from '@/components/ui/app-image';
import { Reveal, StaggerChildren, StaggerItem } from '@/components/site/motion';
import { ScienceSceneMount } from '@/components/site/science-scene-mount';
import { cn } from '@/lib/utils';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const languages = {
    'en-IN': `${appUrl}/en`,
    'gu-IN': `${appUrl}/gu`,
    'hi-IN': `${appUrl}/hi`,
    'x-default': `${appUrl}/en`,
  };
  return {
    title: dict['meta.homeTitle'],
    description: dict['meta.homeDescription'],
    alternates: { canonical: `${appUrl}/${locale}`, languages },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const prefix = `/${locale}`;

  const [settings, notices, events, gallery, featured] = await Promise.all([
    getSiteSettings(),
    getActiveNotices(locale, 3),
    getUpcomingEvents(locale, 3),
    getGalleryHighlights(6),
    getFeaturedProgrammes(locale),
  ]);

  const heroImage = gallery[0];
  const aboutImage = gallery[1];
  const programmeCards =
    featured.length > 0
      ? featured.slice(0, 3).map((programme, index) => ({
          title: programme.title,
          summary: programme.summary,
          href: `${prefix}/${programme.path}`,
          image: programme.coverKey,
          tag: String(index + 1).padStart(2, '0'),
        }))
      : [
          {
            title: dict['home.flagship.sss'],
            summary: dict['home.flagship.sssText'],
            href: `${prefix}/projects/sunday-science-school`,
            image: null,
            tag: '01',
          },
          {
            title: dict['home.flagship.safar'],
            summary: dict['home.flagship.safarText'],
            href: `${prefix}/projects/vigyan-safar`,
            image: null,
            tag: '02',
          },
          {
            title: dict['home.flagship.darshan'],
            summary: dict['home.flagship.darshanText'],
            href: `${prefix}/projects/vigyan-darshan`,
            image: null,
            tag: '03',
          },
        ];

  const stats = [
    { value: String(INSTITUTION.established), label: dict['home.stats.established'] },
    { value: '5', label: dict['home.stats.labs'] },
    { value: '50+', label: dict['home.stats.exhibits'] },
    { value: '6,000+', label: dict['home.stats.books'] },
    { value: '300–350', label: dict['home.stats.students'] },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Cinematic MERIDIAN entrance
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-carbon text-warm-ivory">
        <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 top-0 hidden size-[40rem] rounded-full border border-warm-ivory/5 lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 top-20 hidden size-[28rem] rounded-full border border-warm-ivory/5 lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute right-8 top-16 size-2 rounded-full bg-brass" aria-hidden="true" />
        <ScienceSceneMount className="pointer-events-none absolute -right-56 top-4 hidden size-[34rem] opacity-55 mix-blend-screen lg:block" />

        <div className="site-container relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <Reveal delay={0}>
              <p className="eyebrow !text-brass">{dict['home.eyebrow']}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <h1 className="display-title mt-6 text-[clamp(2.8rem,6vw,5.2rem)] font-medium text-warm-ivory">
                {dict['home.title']}
                <br />
                <span className="text-stone/70">{dict['home.titleAccent']}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-7 max-w-xl text-[1.02rem] leading-relaxed text-warm-ivory/60 sm:text-lg">
                {dict['home.intro']}
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={`${prefix}/projects`} className="btn btn-accent">
                  {dict['home.ctaPrimary']}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href={`${prefix}/contact`} className="btn btn-light">
                  {dict['home.ctaSecondary']}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.55}>
              <div className="mt-9 flex max-w-lg items-start gap-3.5 rounded-xl border border-warm-ivory/10 bg-warm-ivory/5 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brass/20 text-brass">
                  <Award className="size-4" aria-hidden="true" />
                </span>
                <p className="text-xs leading-relaxed text-warm-ivory/50">{dict['home.award']}</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2} variant="clipReveal">
            <div className="relative">
              {heroImage ? (
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-graphite shadow-soft sm:aspect-[5/5]">
                  <AppImage
                    storageKey={heroImage.storageKey}
                    alt={heroImage.alt}
                    width={heroImage.width}
                    height={heroImage.height}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 rounded-xl bg-carbon/85 p-4 backdrop-blur-md">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brass">
                      {dict['home.gallery.eyebrow']}
                    </p>
                    <p className="mt-1.5 font-display text-sm font-medium text-warm-ivory">
                      {heroImage.caption || dict['home.heroCaption']}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-graphite px-8 py-10 shadow-soft">
                  <div className="orbit-ring border-warm-ivory/10" aria-hidden="true" />
                  <div className="orbit-ring rotate-[32deg] scale-[0.65] border-warm-ivory/10" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-warm-ivory/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-warm-ivory/50">
                        {dict['site.tagline']}
                      </span>
                      <Atom className="size-8 text-brass" aria-hidden="true" />
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-3">
                      {[
                        { Icon: Telescope, label: dict['home.stats.exhibits'] },
                        { Icon: FlaskConical, label: dict['home.stats.labs'] },
                        { Icon: Microscope, label: dict['home.stats.students'] },
                        { Icon: Users, label: dict['home.stats.books'] },
                      ].map(({ Icon, label }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-warm-ivory/10 bg-warm-ivory/5 p-4 backdrop-blur-sm"
                        >
                          <Icon className="size-4 text-brass" aria-hidden="true" />
                          <p className="mt-3 text-[11px] leading-snug text-warm-ivory/50">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 h-px bg-warm-ivory/10" />
                    <p className="mt-4 text-[11px] text-warm-ivory/40">
                      {dict['home.heroCaption']}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* Stats bar */}
        <div className="site-container relative pb-14 lg:pb-20">
          <Reveal delay={0.3}>
            <dl className="grid grid-cols-2 divide-warm-ivory/8 overflow-hidden rounded-xl border border-warm-ivory/8 bg-warm-ivory/[0.03] sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
              {stats.map((stat) => (
                <div key={stat.label} className="px-5 py-5">
                  <dt className="text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-warm-ivory/35">
                    {stat.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-medium tracking-tight text-brass sm:text-3xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROGRAMMES — Editorial cards with MERIDIAN identity
          ═══════════════════════════════════════════════════════════ */}
      <section className="site-container py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">{dict['home.flagship.eyebrow']}</p>
            <h2 className="display-title mt-4 text-4xl font-medium sm:text-5xl">
              {dict['home.flagship.title']}
            </h2>
            <p className="mt-4 text-graphite/85">{dict['home.flagship.intro']}</p>
          </div>
          <Link
            href={`${prefix}/projects`}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-sage transition-colors hover:text-carbon"
          >
            {dict['common.viewAll']}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <StaggerChildren className="mt-10 grid gap-5 md:grid-cols-3" staggerDelay={0.12}>
          {programmeCards.map((programme, index) => {
            const Icon = [FlaskConical, Telescope, Microscope][index % 3];
            return (
              <StaggerItem key={programme.href}>
                <Link
                  href={programme.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper transition-all duration-500 hover:-translate-y-1 hover:border-brass/30 hover:shadow-soft"
                >
                  {programme.image ? (
                    <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-t-xl bg-warm-ivory">
                      <AppImage
                        storageKey={programme.image}
                        alt={programme.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-full bg-warm-ivory text-sage">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-[11px] font-semibold tracking-wider text-stone">
                        {programme.tag}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-medium leading-snug text-carbon">
                      {programme.title}
                    </h3>
                    <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                      {programme.summary}
                    </p>
                    <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition-colors group-hover:text-carbon">
                      {dict['common.learnMore']}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          NOTICES & EVENTS — Refined MERIDIAN layout
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-line bg-warm-ivory/50">
        <div className="site-container grid gap-10 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{dict['home.notices.eyebrow']}</p>
                <h2 className="display-title mt-3 text-3xl font-medium sm:text-4xl">
                  {dict['home.notices.title']}
                </h2>
              </div>
              <Link
                href={`${prefix}/notices`}
                className="mb-1 text-xs font-semibold text-sage hover:text-carbon"
              >
                {dict['common.viewAll']}
              </Link>
            </div>
            <div className="mt-6 space-y-2.5">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`${prefix}/notices/${notice.slug}`}
                    className="group flex items-start gap-4 rounded-xl border border-line/80 bg-paper p-4 transition-all duration-300 hover:border-brass/25 hover:shadow-card"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-saffron-light text-brass">
                      <Pin className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        {notice.isPinned ? (
                          <span className="rounded-full bg-brass/12 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brass-dark">
                            {dict['notices.pinned']}
                          </span>
                        ) : null}
                        <span className="text-[10px] font-medium text-ink-muted">
                          {formatDate(notice.publishAt, locale)}
                        </span>
                      </span>
                      <span className="mt-1 block font-display text-[15px] font-medium leading-snug text-carbon transition-colors group-hover:text-brass-dark">
                        {notice.title}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-line bg-paper/60 p-6 text-sm text-ink-muted">
                  {dict['home.notices.empty']}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{dict['home.events.eyebrow']}</p>
                <h2 className="display-title mt-3 text-3xl font-medium sm:text-4xl">
                  {dict['home.events.title']}
                </h2>
              </div>
              <a
                href={settings.external.upcomingEvents}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-sage hover:text-carbon"
              >
                {dict['common.viewAll']}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-6 space-y-2.5">
              {events.length > 0 ? (
                events.map((event) => (
                  <Link
                    key={event.id}
                    href={`${prefix}/events/${event.slug}`}
                    className="group flex gap-4 rounded-xl border border-line/80 bg-paper p-4 transition-all duration-300 hover:border-brass/25 hover:shadow-card"
                  >
                    <span className="grid w-14 shrink-0 place-items-center self-start rounded-lg bg-carbon px-2 py-2.5 text-center text-warm-ivory">
                      <span className="text-[8px] font-semibold uppercase tracking-wider text-warm-ivory/50">
                        {formatDate(event.startAt, locale, { month: 'short' })}
                      </span>
                      <span className="font-display text-xl font-medium leading-none">
                        {formatDate(event.startAt, locale, { day: 'numeric' })}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[15px] font-medium leading-snug text-carbon transition-colors group-hover:text-brass-dark">
                        {event.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {event.location}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-paper/60 p-6">
                  <p className="text-sm text-ink-muted">{dict['home.events.empty']}</p>
                  <a
                    href={settings.external.upcomingEvents}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sage"
                  >
                    {dict['home.events.external']}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ABOUT — Asymmetric editorial composition
          ═══════════════════════════════════════════════════════════ */}
      <section className="site-container py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <Reveal variant="clipReveal">
            <div className="relative">
              <div className="dot-grid absolute -left-5 -top-5 size-32 rounded-xl opacity-60" aria-hidden="true" />
              {aboutImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-warm-ivory shadow-soft">
                  <AppImage
                    storageKey={aboutImage.storageKey}
                    alt={aboutImage.alt}
                    width={aboutImage.width}
                    height={aboutImage.height}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl bg-sage px-8 py-12 text-warm-ivory shadow-soft">
                  <div className="orbit-ring border-warm-ivory/15" aria-hidden="true" />
                  <Atom className="size-16 text-brass" aria-hidden="true" />
                  <p className="mt-20 font-display text-3xl font-medium leading-tight">
                    1997
                    <span className="block text-warm-ivory/50">{dict['home.stats.established']}</span>
                  </p>
                </div>
              )}
              <div className="absolute -bottom-6 right-4 rounded-xl border border-line bg-paper px-5 py-4 shadow-soft sm:right-8">
                <p className="font-display text-lg font-medium text-brass-dark">
                  {INSTITUTION.established}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  {dict['home.stats.established']}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="eyebrow">{dict['home.about.eyebrow']}</p>
            <h2 className="display-title mt-4 text-4xl font-medium sm:text-5xl">{dict['home.about.title']}</h2>
            <p className="mt-5 leading-relaxed text-graphite/85">{dict['home.about.body']}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-paper p-4">
                <Telescope className="size-4.5 text-sage" aria-hidden="true" />
                <p className="mt-3 font-display text-sm font-medium">{dict['home.stats.exhibits']}</p>
                <p className="mt-1 text-xs text-ink-muted">50+</p>
              </div>
              <div className="rounded-xl border border-line bg-paper p-4">
                <BookOpen className="size-4.5 text-sage" aria-hidden="true" />
                <p className="mt-3 font-display text-sm font-medium">{dict['home.stats.books']}</p>
                <p className="mt-1 text-xs text-ink-muted">6,000+</p>
              </div>
            </div>
            <Link href={`${prefix}/about`} className="btn btn-primary mt-7">
              {dict['home.about.cta']}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          GALLERY PREVIEW — Editorial masonry
          ═══════════════════════════════════════════════════════════ */}
      {gallery.length > 0 ? (
        <section className="border-y border-line bg-paper py-20 lg:py-24">
          <div className="site-container">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-xl">
                <p className="eyebrow">{dict['home.gallery.eyebrow']}</p>
                <h2 className="display-title mt-4 text-4xl font-medium">{dict['home.gallery.title']}</h2>
                <p className="mt-3 text-graphite/85">{dict['home.gallery.intro']}</p>
              </div>
              <Link href={`${prefix}/gallery`} className="btn btn-outline">
                {dict['home.gallery.cta']}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <Reveal className="mt-9">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {gallery.slice(0, 4).map((image, index) => (
                  <Link
                    key={image.id}
                    href={`${prefix}/gallery/${image.albumSlug}`}
                    className={cn(
                      'group relative overflow-hidden rounded-xl bg-warm-ivory',
                      index === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square',
                    )}
                  >
                    <AppImage
                      storageKey={image.storageKey}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      fill
                      sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : '25vw'}
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-carbon/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    {image.caption ? (
                      <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-xs font-medium text-warm-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        {image.caption}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════
          PUBLICATIONS & VISIT — MERIDIAN panels
          ═══════════════════════════════════════════════════════════ */}
      <section className="site-container py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <div className="h-full rounded-2xl bg-saffron-light p-8 sm:p-10">
              <p className="eyebrow !text-brass-dark">{dict['home.publications.eyebrow']}</p>
              <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl">
                {dict['home.publications.title']}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-graphite/85">{dict['home.publications.intro']}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`${prefix}/publications`} className="btn btn-primary">
                  {dict['home.publications.cta']}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href={`${prefix}/downloads`} className="btn btn-outline">
                  {dict['common.downloads']}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative h-full overflow-hidden rounded-2xl bg-carbon p-8 text-warm-ivory sm:p-10">
              <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full border border-warm-ivory/5" aria-hidden="true" />
              <div className="relative">
                <p className="section-label !text-brass">{dict['home.visit.eyebrow']}</p>
                <h2 className="mt-3 font-display text-3xl font-medium leading-tight">
                  {dict['home.visit.title']}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-warm-ivory/55">{dict['home.visit.body']}</p>
                <div className="mt-6 flex items-start gap-3 border-t border-warm-ivory/8 pt-5 text-sm text-warm-ivory/70">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" />
                  <span>{settings.contact.address}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`${prefix}/contact`} className="btn btn-accent">
                    {dict['home.visit.cta']}
                  </Link>
                  <a
                    href={settings.contact.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light"
                  >
                    {dict['home.visit.map']}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          QUOTE — Editorial finale
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-line bg-cream">
        <div className="site-container py-16 lg:py-20">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-warm-ivory text-sage">
                <CalendarDays className="size-4.5" aria-hidden="true" />
              </span>
              <blockquote className="mt-6 font-display text-2xl font-medium leading-snug text-carbon sm:text-3xl">
                “{dict['home.quote']}”
              </blockquote>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
                {dict['home.quoteAuthor']}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
