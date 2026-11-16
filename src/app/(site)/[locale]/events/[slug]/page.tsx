import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate, formatDateTime, formatEventRange } from '@/lib/dates';
import { excerptFromHtml } from '@/lib/sanitize';
import { formatNumber, siteOrigin } from '@/lib/meridian/site';
import { getEventBySlug, getUpcomingEvents } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { DateBlock } from '@/components/meridian/cards/date-block';
import { EventCard } from '@/components/meridian/cards/event-card';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { EventRegistrationForm } from '@/components/meridian/forms/event-registration-form';
import { JsonLd } from '@/components/meridian/primitives/json-ld';
import { FallbackNotice } from '@/components/meridian/states/states';

interface EventDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: EventDetailProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const event = await getEventBySlug(slug, rawLocale);
  if (!event) return { title: getDictionary(rawLocale)['notFound.title'] };
  const origin = siteOrigin();
  const description = excerptFromHtml(event.description, 160) || undefined;
  return {
    title: event.title,
    description,
    alternates: { canonical: `${origin}/${rawLocale}/events/${slug}` },
    openGraph: {
      type: 'article',
      title: event.title,
      description,
      url: `${origin}/${rawLocale}/events/${slug}`,
      images: event.coverKey ? [`${origin}/media/${event.coverKey}`] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const event = await getEventBySlug(slug, locale);
  if (!event) notFound();

  const upcoming = await getUpcomingEvents(locale, 4);
  const related = upcoming.filter((item) => item.id !== event.id).slice(0, 3);
  // Registration rules are unchanged from the previous implementation.
  const isPast = event.startAt.getTime() < Date.now();
  const showRegistration = event.registrationEnabled && !isPast && event.registrationOpen;
  const origin = siteOrigin();
  const p = `/${locale}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: excerptFromHtml(event.description, 300) || undefined,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt?.toISOString(),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    image: event.coverKey ? `${origin}/media/${event.coverKey}` : undefined,
    location: {
      '@type': 'Place',
      name: event.location || dict['site.name'],
      address: event.location || undefined,
    },
    organizer: { '@type': 'Organization', name: dict['site.name'], url: `${origin}${p}` },
    url: `${origin}${p}/events/${event.slug}`,
  };

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['events.title'], href: `${p}/events` }, { label: event.title }]}
        eyebrow={event.sectionName}
        title={event.title}
        motif="rings"
        meta={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9375rem] text-(--mx-fg-2)">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-(--mx-amber)" aria-hidden="true" />
              {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-(--mx-cyan)" aria-hidden="true" />
              {event.location || dict['events.locationTbd']}
            </span>
            {showRegistration ? <span className="mx-tag mx-tag-amber">{dict['mx.events.registrationOpen']}</span> : null}
          </div>
        }
        aside={
          event.coverKey ? (
            <figure className="mx-plate relative aspect-[4/3] w-full">
              <CmsImage storageKey={event.coverKey} alt={event.title} sizes="(max-width: 1024px) 100vw, 40vw" priority />
              <span aria-hidden="true" className="mx-ticks" />
            </figure>
          ) : undefined
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14 sm:!pt-20">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16">
            <article className="min-w-0">
              {event.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
              <div className="mx-prose" dangerouslySetInnerHTML={{ __html: event.description }} />
              <Link href={`${p}/events`} className="mx-btn mx-btn-ghost mt-14">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {dict['events.title']}
              </Link>
            </article>

            <aside className="min-w-0">
              <div className="grid gap-6 lg:sticky lg:top-[calc(var(--mx-header-h)+1.5rem)]">
                <section aria-labelledby="event-facts" className="mx-surface-white rounded-(--mx-radius-md) p-6 shadow-[var(--mx-shadow-sm)] sm:p-7">
                  <h2 id="event-facts" className="sr-only">
                    {dict['mx.events.details']}
                  </h2>
                  <div className="flex items-start gap-5 border-b border-(--mx-line) pb-6">
                    <DateBlock date={event.startAt} locale={locale} />
                    <p className="mx-meta pt-5">
                      {event.allDay
                        ? dict['events.allDay']
                        : [event.startAt, event.endAt]
                            .filter((value): value is Date => Boolean(value))
                            .map((value) => formatDate(value, locale, { hour: 'numeric', minute: '2-digit' }))
                            .join(' – ')}
                    </p>
                  </div>
                  <dl className="mt-6 grid gap-5 text-[0.9375rem]">
                    <div className="flex gap-3">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
                      <div>
                        <dt className="mx-mono-label">{dict['events.start']}</dt>
                        <dd className="mt-1 font-semibold">{formatDateTime(event.startAt, locale)}</dd>
                      </div>
                    </div>
                    {event.endAt ? (
                      <div className="flex gap-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
                        <div>
                          <dt className="mx-mono-label">{dict['events.end']}</dt>
                          <dd className="mt-1 font-semibold">{formatDateTime(event.endAt, locale)}</dd>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
                      <div>
                        <dt className="mx-mono-label">{dict['common.location']}</dt>
                        <dd className="mt-1 font-semibold">{event.location || dict['events.locationTbd']}</dd>
                      </div>
                    </div>
                    {event.capacity !== null ? (
                      <div className="flex gap-3">
                        <Users className="mt-0.5 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
                        <div>
                          <dt className="mx-mono-label">{dict['events.participants']}</dt>
                          <dd className="mt-1 font-semibold">
                            {event.remainingSeats === 0
                              ? dict['mx.events.full']
                              : `${formatNumber(event.remainingSeats ?? 0, locale)} / ${formatNumber(event.capacity, locale)} ${dict['mx.events.seatsLeft']}`}
                          </dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                  {event.registrationDeadline ? (
                    <p className="mx-alert mx-alert-info mt-6 text-[0.875rem]">
                      {dict['events.registrationDeadline']}: {formatDateTime(event.registrationDeadline, locale)}
                    </p>
                  ) : null}
                </section>

                <section
                  id="register"
                  aria-labelledby="event-registration"
                  className="mx-surface-white rounded-(--mx-radius-md) p-6 shadow-[var(--mx-shadow-sm)] sm:p-7"
                >
                  <h2 id="event-registration" className="mx-h4">
                    {dict['events.registrationTitle']}
                  </h2>
                  {showRegistration ? (
                    <>
                      <p className="mt-2 text-[0.875rem] text-(--mx-fg-3)">{dict['events.registrationIntro']}</p>
                      <div className="mt-6">
                        <EventRegistrationForm eventId={event.id} locale={locale} dict={dict} />
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-[0.9375rem] text-(--mx-fg-2)">
                      {event.registrationEnabled ? dict['events.registrationClosed'] : dict['events.registrationUnavailable']}
                    </p>
                  )}
                </section>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-events" className="mx-surface-white mx-section">
          <div className="mx-container">
            <h2 id="related-events" className="mx-h3">
              {dict['mx.events.related']}
            </h2>
            <div className="mt-8 border-b border-(--mx-line)">
              {related.map((item) => (
                <EventCard key={item.id} event={item} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd data={structuredData} />
    </>
  );
}
