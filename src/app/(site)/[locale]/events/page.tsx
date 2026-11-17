import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { isSafeHttpUrl } from '@/lib/utils';
import { localeAlternates } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { getPastEvents, getUpcomingEvents, type PublicEvent } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { EventCard } from '@/components/meridian/cards/event-card';
import { MonthRuler } from '@/components/meridian/cards/month-ruler';
import { Reveal } from '@/components/meridian/motion/reveal';
import { EmptyState } from '@/components/meridian/states/states';

interface EventsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EventsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['events.title'],
    description: dict['events.intro'],
    alternates: localeAlternates(locale, '/events'),
  };
}

function groupByYear(events: PublicEvent[], locale: LocaleCode) {
  const groups = new Map<string, PublicEvent[]>();
  for (const event of events) {
    const year = formatDate(event.startAt, locale, { year: 'numeric' });
    groups.set(year, [...(groups.get(year) ?? []), event]);
  }
  return Array.from(groups.entries());
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [upcoming, past, settings] = await Promise.all([
    getUpcomingEvents(locale, 12),
    getPastEvents(locale, 12),
    getSiteSettings(),
  ]);
  const [featured, ...rest] = upcoming;
  const calendar =
    settings.external.upcomingEvents && isSafeHttpUrl(settings.external.upcomingEvents)
      ? settings.external.upcomingEvents
      : null;
  const pastByYear = groupByYear(past, locale);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['events.title'] }]}
        eyebrow={dict['home.events.eyebrow']}
        title={dict['mx.events.title']}
        accent={dict['mx.events.titleAccent']}
        intro={dict['events.intro']}
        motif="meridian"
        meta={
          <div className="flex flex-wrap gap-3">
            <a href="#upcoming" className="mx-chip">
              {dict['events.upcoming']} · {upcoming.length}
            </a>
            <a href="#past" className="mx-chip">
              {dict['events.past']} · {past.length}
            </a>
            {calendar ? (
              <a href={calendar} target="_blank" rel="noopener noreferrer" className="mx-chip">
                {dict['nav.upcomingExternal']}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                <span className="sr-only">({dict['a11y.newTab']})</span>
              </a>
            ) : null}
          </div>
        }
      />

      <section id="upcoming" aria-labelledby="upcoming-title" className="mx-surface-ivory mx-section !pt-16 scroll-mt-24">
        <div className="mx-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:items-end">
            <h2 id="upcoming-title" className="mx-h2">
              {dict['events.upcoming']}
            </h2>
            <div>
              <p className="mx-mono-label mb-4">{dict['mx.events.ruler']}</p>
              <MonthRuler events={upcoming} locale={locale} label={dict['mx.events.ruler']} />
            </div>
          </div>
          <div className="mt-10">
            {featured ? (
              <>
                <Reveal>
                  <div id={`event-${featured.id}`} className="scroll-mt-28" />
                  <EventCard event={featured} locale={locale} dict={dict} variant="feature" headingLevel="h3" />
                </Reveal>
                {rest.length ? (
                  <div className="mt-12 border-b border-(--mx-line)">
                    {rest.map((event) => (
                      <div key={event.id} id={`event-${event.id}`} className="scroll-mt-28">
                        <EventCard event={event} locale={locale} dict={dict} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title={dict['events.empty']}
                body={<p>{dict['mx.events.rulerEmpty']}</p>}
                action={
                  <>
                    {calendar ? (
                      <a href={calendar} target="_blank" rel="noopener noreferrer" className="mx-btn mx-btn-ink">
                        {dict['home.events.external']}
                        <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                        <span className="sr-only">({dict['a11y.newTab']})</span>
                      </a>
                    ) : null}
                    <Link href={`/${locale}/notices`} className="mx-btn mx-btn-ghost">
                      {dict['nav.notices']}
                    </Link>
                  </>
                }
              />
            )}
          </div>
        </div>
      </section>

      <section id="past" aria-labelledby="past-title" className="mx-surface-white mx-section scroll-mt-24">
        <div className="mx-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
              <h2 id="past-title" className="mx-h2">
                {dict['events.past']}
              </h2>
              <p className="mt-4 max-w-sm text-(--mx-fg-2)">{dict['mx.events.archiveIntro']}</p>
            </div>
          </div>
          <div className="lg:col-span-8">
            {pastByYear.length ? (
              pastByYear.map(([year, events]) => (
                <div key={year} className="mb-12 last:mb-0">
                  <p className="mx-numeric text-5xl text-(--mx-fg-3)">{year}</p>
                  <div className="mt-4 border-b border-(--mx-line)">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} locale={locale} dict={dict} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="border-y border-(--mx-line) py-10 text-(--mx-fg-2)">{dict['events.emptyPast']}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
