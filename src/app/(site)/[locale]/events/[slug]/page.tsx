import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDateTime, formatEventRange } from '@/lib/dates';
import { getEventBySlug } from '@/server/public/queries';
import { AppImage } from '@/components/ui/app-image';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FallbackNotice } from '@/components/ui/fallback-notice';
import { PageHeader } from '@/components/ui/page-header';
import { EventRegistrationForm } from '@/components/site/event-registration-form';

interface EventDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: EventDetailProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const event = await getEventBySlug(slug, rawLocale);
  if (!event) return { title: 'Event not found' };
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: event.title,
    description: undefined,
    alternates: { canonical: `${appUrl}/${rawLocale}/events/${slug}` },
    openGraph: {
      type: 'article',
      title: event.title,
      url: `${appUrl}/${rawLocale}/events/${slug}`,
      images: event.coverKey ? [`${appUrl}/media/${event.coverKey}`] : undefined,
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

  const isPast = event.startAt.getTime() < Date.now();
  const showRegistration = event.registrationEnabled && !isPast && event.registrationOpen;

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[
            { label: dict['events.title'], href: `/${locale}/events` },
            { label: event.title },
          ]}
        />
      </div>
      <PageHeader tone="ink" eyebrow={event.sectionName} title={event.title}>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-warm-ivory/55">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-brass" aria-hidden="true" />
            {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-brass" aria-hidden="true" />
              {event.location}
            </span>
          ) : null}
        </div>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <article className="min-w-0">
            {event.isFallback ? (
              <div className="mb-6">
                <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
              </div>
            ) : null}
            {event.coverKey ? (
              <div className="image-reveal relative mb-8 aspect-[16/8] overflow-hidden rounded-3xl bg-graphite shadow-card">
                <AppImage
                  storageKey={event.coverKey}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
            ) : null}
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
            <Link
              href={`/${locale}/events`}
              className="group mt-10 inline-flex items-center gap-1.5 text-sm font-bold text-sage transition-colors hover:text-carbon"
            >
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              {dict['common.back']}
            </Link>
          </article>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg font-semibold">{dict['events.venue']}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      {dict['events.start']}
                    </dt>
                    <dd className="font-semibold text-ink">{formatDateTime(event.startAt, locale)}</dd>
                  </div>
                </div>
                {event.endAt ? (
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {dict['events.end']}
                      </dt>
                      <dd className="font-semibold text-ink">{formatDateTime(event.endAt, locale)}</dd>
                    </div>
                  </div>
                ) : null}
                {event.location ? (
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {dict['common.location']}
                      </dt>
                      <dd className="font-semibold text-ink">{event.location}</dd>
                    </div>
                  </div>
                ) : null}
                {event.capacity !== null ? (
                  <div className="flex gap-3">
                    <Users className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {dict['events.participants']}
                      </dt>
                      <dd className="font-semibold text-ink">
                        {event.remainingSeats ?? 0} / {event.capacity}
                      </dd>
                    </div>
                  </div>
                ) : null}
              </dl>
              {event.registrationDeadline ? (
                <p className="mt-4 rounded-lg bg-sky px-3 py-2 text-xs text-ink-soft">
                  {dict['events.registrationDeadline']}: {formatDateTime(event.registrationDeadline, locale)}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg font-semibold">
                {dict['events.registrationTitle']}
              </h2>
              {showRegistration ? (
                <>
                  <p className="mt-1 text-xs text-ink-muted">{dict['events.registrationIntro']}</p>
                  <div className="mt-4">
                    <EventRegistrationForm eventId={event.id} locale={locale} dict={dict} />
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">
                  {event.registrationEnabled
                    ? dict['events.registrationClosed']
                    : dict['events.registrationUnavailable']}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
