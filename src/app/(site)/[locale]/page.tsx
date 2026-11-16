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
  Compass,
  FileText,
  FlaskConical,
  Images,
  MapPin,
  Microscope,
  Newspaper,
  Pin,
  Sparkles,
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
  getPublishedBlogPosts,
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
    title: `${dict['meta.homeTitle']} | MERIDIAN`,
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

  const [settings, notices, events, gallery, featured, blogPosts] = await Promise.all([
    getSiteSettings(),
    getActiveNotices(locale, 4),
    getUpcomingEvents(locale, 3),
    getGalleryHighlights(8),
    getFeaturedProgrammes(locale),
    getPublishedBlogPosts(locale, 3),
  ]);

  const heroImage = gallery[0];
  const aboutImage = gallery[1];
  const observationImage = gallery[2] || gallery[0];

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
    { value: String(INSTITUTION.established), label: dict['home.stats.established'], note: '27+ Years of Service' },
    { value: '5', label: dict['home.stats.labs'], note: 'Hands-on Disciplines' },
    { value: '50+', label: dict['home.stats.exhibits'], note: 'Interactive Models' },
    { value: '6,000+', label: dict['home.stats.books'], note: 'Science Library' },
    { value: '350+', label: dict['home.stats.students'], note: 'Sunday Scholars / Year' },
  ];

  return (
    <div className="flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HERO EXPERIENCE — MERIDIAN SIGNATURE
          Where Curiosity Meets Discovery
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-midnight text-warm-ivory">
        {/* Background Atmosphere & Coordinate Grid */}
        <div className="science-grid-dark absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-48 -top-32 hidden size-[48rem] rounded-full border border-cyan/10 lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-16 hidden size-[32rem] rounded-full border border-solar/15 lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-16 top-24 size-2.5 rounded-full bg-solar shadow-[0_0_12px_#E9A94B]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-12 bottom-24 size-2 rounded-full bg-cyan shadow-[0_0_10px_#52D5E8]"
          aria-hidden="true"
        />

        {/* 3D Interactive / Canvas Centerpiece Mount */}
        <ScienceSceneMount className="pointer-events-none absolute -right-36 top-6 hidden size-[38rem] opacity-75 mix-blend-screen lg:block xl:-right-16" />

        <div className="site-container relative grid items-center gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
          <div>
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan/25 bg-cosmic/60 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan backdrop-blur-md">
                <Sparkles className="size-3 text-solar" aria-hidden="true" />
                <span>{dict['home.eyebrow']}</span>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <h1 className="display-title mt-6 text-[clamp(2.75rem,5.8vw,5.2rem)] font-medium tracking-tight text-white leading-[1.05]">
                {dict['home.title']}
                <br />
                <span className="bg-gradient-to-r from-cyan via-teal-200 to-solar bg-clip-text text-transparent">
                  {dict['home.titleAccent']}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-warm-ivory/75 sm:text-lg">
                {dict['home.intro']}
              </p>
            </Reveal>

            <Reveal delay={0.36}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href={`${prefix}/projects`} className="btn btn-accent !py-3.5 !px-6 text-sm">
                  {dict['home.ctaPrimary']}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href={`${prefix}/contact`} className="btn btn-light !py-3.5 !px-6 text-sm">
                  {dict['home.ctaSecondary']}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.48}>
              <div className="mt-10 flex max-w-lg items-start gap-3.5 rounded-2xl border border-white/10 bg-cosmic/40 p-4 backdrop-blur-md">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-solar/15 text-solar shadow-inner">
                  <Award className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-solar">
                    NCSTC · Government of India
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-warm-ivory/65">
                    {dict['home.award']}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Hero Visual Showcase */}
          <Reveal delay={0.2} variant="clipReveal">
            <div className="relative">
              {heroImage ? (
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-cosmic shadow-2xl sm:aspect-[5/5]">
                  <AppImage
                    storageKey={heroImage.storageKey}
                    alt={heroImage.alt}
                    width={heroImage.width}
                    height={heroImage.height}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-midnight/80 p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">
                        {dict['home.gallery.eyebrow']}
                      </p>
                      <span className="flex size-2 rounded-full bg-cyan animate-pulse" />
                    </div>
                    <p className="mt-2 font-display text-base font-medium text-white">
                      {heroImage.caption || dict['home.heroCaption']}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-cosmic/70 px-8 py-12 shadow-2xl backdrop-blur-md">
                  <div className="orbit-ring border-cyan/20" aria-hidden="true" />
                  <div className="orbit-ring rotate-[32deg] scale-[0.65] border-solar/20" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan">
                        {dict['site.tagline']}
                      </span>
                      <Atom className="size-8 text-solar animate-[slowRotate_20s_linear_infinite]" aria-hidden="true" />
                    </div>
                    <div className="mt-14 grid grid-cols-2 gap-3.5">
                      {[
                        { Icon: Telescope, label: dict['home.stats.exhibits'] },
                        { Icon: FlaskConical, label: dict['home.stats.labs'] },
                        { Icon: Microscope, label: dict['home.stats.students'] },
                        { Icon: Users, label: dict['home.stats.books'] },
                      ].map(({ Icon, label }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-cyan/40"
                        >
                          <Icon className="size-4.5 text-cyan" aria-hidden="true" />
                          <p className="mt-3 text-xs leading-snug text-warm-ivory/65">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 h-px bg-white/10" />
                    <p className="mt-4 text-xs text-warm-ivory/50">
                      {dict['home.heroCaption']}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: AT A GLANCE — VERIFIED METRICS RIBBON
            ═══════════════════════════════════════════════════════════ */}
        <div className="site-container relative pb-16 lg:pb-24">
          <Reveal delay={0.3}>
            <dl className="grid grid-cols-2 divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-cosmic/40 shadow-xl backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
              {stats.map((stat) => (
                <div key={stat.label} className="p-6 transition-colors hover:bg-white/[0.03]">
                  <dt className="text-[10px] font-bold uppercase leading-tight tracking-[0.16em] text-cyan">
                    {stat.label}
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-medium tracking-tight text-solar sm:text-4xl tabular-nums">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-[11px] text-warm-ivory/45">{stat.note}</p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: INSTITUTIONAL INTRODUCTION — EDITORIAL
          "Making Science Accessible to Everyone"
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-warm-ivory/50 py-24 lg:py-32 border-b border-line">
        <div className="site-container grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <Reveal variant="clipReveal">
            <div className="relative">
              <div className="dot-grid absolute -left-6 -top-6 size-36 rounded-2xl opacity-70" aria-hidden="true" />
              {aboutImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-paper shadow-card">
                  <AppImage
                    storageKey={aboutImage.storageKey}
                    alt={aboutImage.alt}
                    width={aboutImage.width}
                    height={aboutImage.height}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-3xl bg-midnight px-8 py-14 text-warm-ivory shadow-xl">
                  <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
                  <Atom className="size-16 text-cyan" aria-hidden="true" />
                  <p className="mt-16 font-display text-4xl font-medium leading-tight">
                    1997
                    <span className="block text-base text-warm-ivory/50">{dict['home.stats.established']}</span>
                  </p>
                </div>
              )}
              <div className="absolute -bottom-6 right-4 rounded-2xl border border-line bg-white px-6 py-4 shadow-xl sm:right-8">
                <p className="font-display text-2xl font-semibold text-solar">
                  {INSTITUTION.established}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-muted">
                  {dict['home.stats.established']}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <p className="eyebrow !text-solar">{dict['home.about.eyebrow']}</p>
              <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl lg:text-5xl text-midnight">
                {dict['home.about.title']}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-muted sm:text-lg">
                {dict['home.about.body']}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                  <Telescope className="size-5 text-teal-600" aria-hidden="true" />
                  <p className="mt-3 font-display text-base font-semibold text-midnight">{dict['home.stats.exhibits']}</p>
                  <p className="mt-1 text-xs text-slate-muted">50+ working participatory science stations</p>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                  <BookOpen className="size-5 text-teal-600" aria-hidden="true" />
                  <p className="mt-3 font-display text-base font-semibold text-midnight">{dict['home.stats.books']}</p>
                  <p className="mt-1 text-xs text-slate-muted">6,000+ Gujarati and English science volumes</p>
                </div>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href={`${prefix}/about`} className="btn btn-primary">
                  {dict['home.about.cta']}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href={`${prefix}/infrastructure`} className="btn btn-outline">
                  {dict['nav.infrastructure']}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: FLAGSHIP SCIENTIFIC EXPERIENCES
          Asymmetrical Editorial Discovery Grid
          ═══════════════════════════════════════════════════════════ */}
      <section className="site-container py-24 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow !text-solar">{dict['home.flagship.eyebrow']}</p>
            <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl lg:text-5xl text-midnight">
              {dict['home.flagship.title']}
            </h2>
            <p className="mt-4 text-base text-slate-muted">{dict['home.flagship.intro']}</p>
          </div>
          <Link
            href={`${prefix}/projects`}
            className="group inline-flex items-center gap-2 text-sm font-bold text-teal-600 transition-colors hover:text-midnight"
          >
            <span>{dict['common.viewAll']}</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <StaggerChildren className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
          {programmeCards.map((programme, index) => {
            const Icon = [FlaskConical, Telescope, Microscope][index % 3];
            return (
              <StaggerItem key={programme.href}>
                <Link
                  href={programme.href}
                  className="meridian-card group flex h-full flex-col overflow-hidden"
                >
                  {programme.image ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-warm-ivory">
                      <AppImage
                        storageKey={programme.image}
                        alt={programme.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 rounded-full bg-midnight/80 px-3 py-1 text-[11px] font-bold text-cyan backdrop-blur-md">
                        {programme.tag}
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-gradient-to-br from-midnight to-cosmic p-6 text-warm-ivory">
                      <div className="flex items-center justify-between">
                        <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-cyan">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="font-display text-xs font-bold tracking-wider text-solar">
                          {programme.tag}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <h3 className="font-display text-xl font-medium leading-snug text-midnight transition-colors group-hover:text-solar">
                      {programme.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-muted">
                      {programme.summary}
                    </p>
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-line/60">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors group-hover:text-midnight">
                        {dict['common.learnMore']}
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-muted/60">
                        Active Programme
                      </span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: SCIENCE AND DISCOVERY VISUAL EXPERIENCE
          "Look Beyond What You Know" — The Observatory & Astronomy
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-midnight text-warm-ivory py-24 lg:py-32">
        <div className="science-grid-cyan absolute inset-0 opacity-20" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[44rem] rounded-full border border-cyan/15 opacity-60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[28rem] rounded-full border border-solar/20 opacity-40"
          aria-hidden="true"
        />

        <div className="site-container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cosmic/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan backdrop-blur-md">
                <Compass className="size-3.5 text-solar" aria-hidden="true" />
                <span>Observatory & Sky Watches</span>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <h2 className="display-title mt-6 text-3xl font-medium sm:text-5xl lg:text-6xl text-white">
                Look Beyond What You Know.
              </h2>
            </Reveal>

            <Reveal delay={0.24}>
              <p className="mt-6 text-base leading-relaxed text-warm-ivory/70 sm:text-lg">
                From peering through high-precision astronomical telescopes during celestial eclipses to discovering microscopic life in living biology ponds, Lok Vigyan Kendra is a gateway to the cosmos and the microscopic world.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <Reveal delay={0.1}>
              <div className="meridian-card-dark p-7 h-full flex flex-col">
                <span className="grid size-12 place-items-center rounded-2xl bg-cyan/10 text-cyan">
                  <Telescope className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium text-white">
                  Astronomy & Sky Gazing
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-ivory/65">
                  Regular evening sky watches, tracking solar eclipses, Jupiter’s moons, Saturn’s rings, and meteor showers with guided commentary for students and families.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="meridian-card-dark p-7 h-full flex flex-col border-solar/25">
                <span className="grid size-12 place-items-center rounded-2xl bg-solar/15 text-solar">
                  <FlaskConical className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium text-white">
                  5 Specialized Laboratories
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-ivory/65">
                  Dedicated laboratories in Physics, Chemistry, Biology, Electronics, and Mathematics where participants perform curriculum and beyond-curriculum experiments.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="meridian-card-dark p-7 h-full flex flex-col">
                <span className="grid size-12 place-items-center rounded-2xl bg-teal-400/10 text-teal-300">
                  <Microscope className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium text-white">
                  Community Science Outreach
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-ivory/65">
                  Mobile science vehicles travelling into rural Saurashtra to conduct anti-superstition demonstrations, water testing, and science awareness sessions.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: UPCOMING EVENTS & NOTICES DUAL SHOWCASE
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-warm-ivory/40 py-24 lg:py-32 border-b border-line">
        <div className="site-container grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Notices */}
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow !text-solar">{dict['home.notices.eyebrow']}</p>
                <h2 className="display-title mt-3 text-2xl font-medium sm:text-3xl lg:text-4xl text-midnight">
                  {dict['home.notices.title']}
                </h2>
              </div>
              <Link
                href={`${prefix}/notices`}
                className="mb-1 text-xs font-bold text-teal-600 hover:text-midnight transition-colors"
              >
                {dict['common.viewAll']}
              </Link>
            </div>

            <div className="mt-7 space-y-3.5">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`${prefix}/notices/${notice.slug}`}
                    className="meridian-card group flex items-start gap-4 p-4.5 sm:p-5"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-solar/15 text-solar shadow-xs">
                      <Pin className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {notice.isPinned ? (
                          <span className="rounded-full bg-solar/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
                            {dict['notices.pinned']}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-semibold text-slate-muted">
                          {formatDate(notice.publishAt, locale)}
                        </span>
                        <span className="text-[11px] text-slate-muted/60">· {notice.sectionName}</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-midnight transition-colors group-hover:text-solar">
                        {notice.title}
                      </h3>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-slate-muted">
                  {dict['home.notices.empty']}
                </div>
              )}
            </div>
          </Reveal>

          {/* Right Column: Events */}
          <Reveal delay={0.15}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow !text-solar">{dict['home.events.eyebrow']}</p>
                <h2 className="display-title mt-3 text-2xl font-medium sm:text-3xl lg:text-4xl text-midnight">
                  {dict['home.events.title']}
                </h2>
              </div>
              <a
                href={settings.external.upcomingEvents}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-midnight"
              >
                <span>{dict['common.viewAll']}</span>
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-7 space-y-3.5">
              {events.length > 0 ? (
                events.map((event) => (
                  <Link
                    key={event.id}
                    href={`${prefix}/events/${event.slug}`}
                    className="meridian-card group flex gap-4.5 p-4.5 sm:p-5"
                  >
                    <span className="grid w-14 shrink-0 place-items-center self-start rounded-xl bg-midnight px-2 py-3 text-center text-warm-ivory shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cyan">
                        {formatDate(event.startAt, locale, { month: 'short' })}
                      </span>
                      <span className="font-display text-2xl font-semibold leading-none text-white mt-0.5">
                        {formatDate(event.startAt, locale, { day: 'numeric' })}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-semibold leading-snug text-midnight transition-colors group-hover:text-solar">
                        {event.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-teal-600" aria-hidden="true" />
                          {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-teal-600" aria-hidden="true" />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center">
                  <p className="text-sm text-slate-muted">{dict['home.events.empty']}</p>
                  <a
                    href={settings.external.upcomingEvents}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-midnight"
                  >
                    <span>{dict['home.events.external']}</span>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: LATEST INSIGHTS / ACTIVITY BLOG
          Editorial Scientific Publication
          ═══════════════════════════════════════════════════════════ */}
      {blogPosts.length > 0 ? (
        <section className="site-container py-24 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow !text-solar">{dict['nav.blog']}</p>
              <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl lg:text-5xl text-midnight">
                {dict['blog.title']}
              </h2>
              <p className="mt-4 text-base text-slate-muted">{dict['blog.intro']}</p>
            </div>
            <Link
              href={`${prefix}/blog`}
              className="btn btn-outline"
            >
              <span>{dict['common.viewAll']}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`${prefix}/blog/${post.slug}`}
                className="meridian-card group flex flex-col overflow-hidden"
              >
                {post.coverKey ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-warm-ivory">
                    <AppImage
                      storageKey={post.coverKey}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative bg-midnight p-6 text-warm-ivory">
                    <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
                    <Newspaper className="size-6 text-cyan" aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-muted">
                    <span>{formatDate(post.publishedAt, locale)}</span>
                    <span>·</span>
                    <span className="text-teal-600">{post.category || post.sectionName}</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-midnight transition-colors group-hover:text-solar">
                    {post.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-muted">
                    {post.summary}
                  </p>
                  <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors group-hover:text-midnight">
                    {dict['common.readMore']}
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: PHOTOGRAPHIC GALLERY PREVIEW
          Editorial Masonry with Lightbox Affordance
          ═══════════════════════════════════════════════════════════ */}
      {gallery.length > 0 ? (
        <section className="bg-warm-ivory/50 py-24 lg:py-32 border-y border-line">
          <div className="site-container">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="eyebrow !text-solar">{dict['home.gallery.eyebrow']}</p>
                <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl lg:text-5xl text-midnight">
                  {dict['home.gallery.title']}
                </h2>
                <p className="mt-4 text-base text-slate-muted">{dict['home.gallery.intro']}</p>
              </div>
              <Link href={`${prefix}/gallery`} className="btn btn-primary">
                {dict['home.gallery.cta']}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <Reveal className="mt-12">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {gallery.slice(0, 4).map((image, index) => (
                  <Link
                    key={image.id}
                    href={`${prefix}/gallery/${image.albumSlug}`}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl bg-cosmic shadow-card',
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
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {image.caption ? (
                      <span className="absolute inset-x-4 bottom-4 line-clamp-2 text-xs font-medium text-warm-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
          SECTION 9: PUBLICATIONS & RESOURCES FEATURE
          ═══════════════════════════════════════════════════════════ */}
      <section className="site-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <Reveal>
            <div className="h-full rounded-3xl border border-line bg-gradient-to-br from-solar/10 via-warm-ivory to-white p-8 sm:p-12 shadow-card">
              <p className="eyebrow !text-solar">{dict['home.publications.eyebrow']}</p>
              <h2 className="display-title mt-4 text-3xl font-medium sm:text-4xl lg:text-5xl text-midnight">
                {dict['home.publications.title']}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-muted">
                {dict['home.publications.intro']}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
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

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 10: VISIT / JOURNEY OF DISCOVERY FINAL CTA
              ═══════════════════════════════════════════════════════════ */}
          <Reveal delay={0.15}>
            <div className="relative h-full overflow-hidden rounded-3xl bg-midnight p-8 sm:p-12 text-warm-ivory shadow-xl border border-cosmic">
              <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-cyan/15" aria-hidden="true" />
              <div className="relative flex flex-col h-full">
                <p className="section-label !text-cyan">{dict['home.visit.eyebrow']}</p>
                <h2 className="mt-3 font-display text-2xl font-medium sm:text-3xl lg:text-4xl text-white">
                  {dict['home.visit.title']}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-warm-ivory/70">{dict['home.visit.body']}</p>
                
                <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5 text-sm text-warm-ivory/80">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden="true" />
                  <span>{settings.contact.address}</span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`${prefix}/contact`} className="btn btn-accent !py-3 !px-5 text-xs font-bold">
                    {dict['home.visit.cta']}
                  </Link>
                  <a
                    href={settings.contact.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light !py-3 !px-5 text-xs font-bold"
                  >
                    {dict['home.visit.map']}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 11: EDITORIAL QUOTE & LEGACY
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-line bg-cream py-20 lg:py-24">
        <div className="site-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-solar/15 text-solar shadow-inner">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <blockquote className="mt-6 font-display text-2xl font-medium leading-snug text-midnight sm:text-3xl">
                “{dict['home.quote']}”
              </blockquote>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-muted">
                {dict['home.quoteAuthor']}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
