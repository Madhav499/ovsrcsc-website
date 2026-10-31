import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { getSiteSettings } from '@/server/services/settings';
import { getPastEvents, getUpcomingEvents } from '@/server/public/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from '@/components/site/event-card';

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
    alternates: {
      canonical: `${process.env.APP_URL ?? 'http://localhost:3000'}/${locale}/events`,
      languages: {
        'en-IN': `${process.env.APP_URL ?? 'http://localhost:3000'}/en/events`,
        'gu-IN': `${process.env.APP_URL ?? 'http://localhost:3000'}/gu/events`,
        'hi-IN': `${process.env.APP_URL ?? 'http://localhost:3000'}/hi/events`,
        'x-default': `${process.env.APP_URL ?? 'http://localhost:3000'}/en/events`,
      },
    },
  };
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

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['events.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.events']}
        title={dict['events.title']}
        intro={dict['events.intro']}
      >
        <a
          href={settings.external.upcomingEvents}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-light"
        >
          {dict['home.events.external']}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <section aria-labelledby="upcoming-events">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-carbon text-warm-ivory">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <h2 id="upcoming-events" className="font-display text-2xl font-medium sm:text-3xl">
              {dict['events.upcoming']}
            </h2>
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  learnMore={dict['common.learnMore']}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-7"
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
            >
              {dict['home.events.empty']}
            </EmptyState>
          )}
        </section>

        {past.length > 0 ? (
          <section className="mt-16 border-t border-line pt-12" aria-labelledby="past-events">
            <h2 id="past-events" className="font-display text-2xl font-medium sm:text-3xl">
              {dict['events.past']}
            </h2>
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  learnMore={dict['common.learnMore']}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
