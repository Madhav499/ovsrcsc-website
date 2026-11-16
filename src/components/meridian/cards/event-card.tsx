import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatEventRange } from '@/lib/dates';
import { excerptFromHtml } from '@/lib/sanitize';
import type { PublicEvent } from '@/server/public/queries';
import { cn } from '@/lib/utils';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { DateBlock } from './date-block';

interface EventCardProps {
  event: PublicEvent;
  locale: LocaleCode;
  dict: Dictionary;
  variant?: 'feature' | 'row';
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

function registrationOpen(event: PublicEvent): boolean {
  return (
    event.registrationEnabled &&
    (!event.registrationDeadline || event.registrationDeadline.getTime() > Date.now())
  );
}

/**
 * "Ticket" style event card. `feature` is a large two-column composition
 * with the cover image; `row` is a compact schedule line.
 */
export function EventCard({
  event,
  locale,
  dict,
  variant = 'row',
  headingLevel: Heading = 'h3',
  className,
}: EventCardProps) {
  const href = `/${locale}/events/${event.slug}`;
  const when = formatEventRange(event.startAt, event.endAt, locale, event.allDay);
  const summary = excerptFromHtml(event.description, variant === 'feature' ? 220 : 140);
  const open = registrationOpen(event);

  if (variant === 'feature') {
    return (
      <article
        className={cn(
          'mx-card mx-card-interactive group relative grid overflow-hidden md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]',
          className,
        )}
      >
        <div className="mx-plate mx-zoom relative aspect-[4/3] rounded-none md:aspect-auto md:min-h-[24rem]">
          {event.coverKey ? (
            <CmsImage
              storageKey={event.coverKey}
              alt=""
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="mx-surface-dark absolute inset-0">
              <div aria-hidden="true" className="mx-atmosphere absolute inset-0" />
              <div aria-hidden="true" className="mx-starfield absolute inset-0" />
            </div>
          )}
          <span aria-hidden="true" className="mx-ticks" />
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mx-tag mx-tag-amber">{dict['mx.events.featured']}</span>
            {open ? <span className="mx-tag">{dict['mx.events.registrationOpen']}</span> : null}
          </div>
          <div className="mt-6 flex items-start gap-6">
            <DateBlock date={event.startAt} locale={locale} size="lg" />
            <div className="min-w-0 pt-1">
              <p className="mx-mono-label">{event.sectionName}</p>
              <Heading className="mx-h3 mt-2">
                <Link href={href} className="after:absolute after:inset-0">
                  {event.title}
                </Link>
              </Heading>
            </div>
          </div>
          {summary ? <p className="mx-line-clamp-3 mt-5 text-(--mx-fg-2)">{summary}</p> : null}
          <dl className="mt-6 grid gap-2.5 text-[0.9375rem] text-(--mx-fg-2)">
            <div className="flex items-start gap-2.5">
              <dt className="sr-only">{dict['mx.events.when']}</dt>
              <Clock className="mt-1 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
              <dd>{when}</dd>
            </div>
            <div className="flex items-start gap-2.5">
              <dt className="sr-only">{dict['mx.events.where']}</dt>
              <MapPin className="mt-1 size-4 shrink-0 text-(--mx-accent)" aria-hidden="true" />
              <dd>{event.location || dict['events.locationTbd']}</dd>
            </div>
          </dl>
          <span className="mx-link mt-auto self-start pt-8">
            {dict['mx.events.details']}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 border-t border-(--mx-line) py-7 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-x-8',
        className,
      )}
    >
      <DateBlock date={event.startAt} locale={locale} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mx-mono-label">{event.sectionName}</span>
          {open ? <span className="mx-tag">{dict['mx.events.registrationOpen']}</span> : null}
        </div>
        <Heading className="mx-h4 mt-2 transition-colors duration-300 group-hover:text-(--mx-accent)">
          <Link href={href} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </Heading>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.875rem] text-(--mx-fg-3)">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {when}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {event.location || dict['events.locationTbd']}
          </span>
        </p>
        {summary ? <p className="mx-line-clamp-2 mt-3 max-w-2xl text-[0.9375rem] text-(--mx-fg-2)">{summary}</p> : null}
      </div>
      <span
        aria-hidden="true"
        className="hidden size-12 place-items-center self-center rounded-full border border-(--mx-line-strong) transition-all duration-500 group-hover:border-(--mx-fg) group-hover:bg-(--mx-fg) group-hover:text-(--mx-bg) sm:grid"
      >
        <ArrowRight className="size-4" />
      </span>
    </article>
  );
}
