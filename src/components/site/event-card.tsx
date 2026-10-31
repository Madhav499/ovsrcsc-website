import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import { formatDate, formatEventRange } from '@/lib/dates';
import type { PublicEvent } from '@/server/public/queries';
import { AppImage } from '@/components/ui/app-image';

interface EventCardProps {
  event: PublicEvent;
  locale: LocaleCode;
  learnMore: string;
}

export function EventCard({ event, locale, learnMore }: EventCardProps) {
  return (
    <Link
      href={`/${locale}/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper transition-all duration-500 hover:-translate-y-1 hover:border-brass/30 hover:shadow-soft"
    >
      {event.coverKey ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-warm-ivory">
          <AppImage
            storageKey={event.coverKey}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden bg-carbon px-6 py-7 text-warm-ivory">
          <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border border-warm-ivory/8" />
          <div className="relative">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brass">
              {event.sectionName}
            </p>
            <p className="mt-4 font-display text-4xl font-medium leading-none">
              {formatDate(event.startAt, locale, { day: '2-digit' })}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-warm-ivory/45">
              {formatDate(event.startAt, locale, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-3 text-[10px] font-medium text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-sage" aria-hidden="true" />
            {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
          </span>
        </div>
        <h3 className="mt-2.5 font-display text-lg font-medium leading-snug text-carbon transition-colors duration-300 group-hover:text-brass-dark">
          {event.title}
        </h3>
        {event.location ? (
          <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-ink-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-sage" aria-hidden="true" />
            {event.location}
          </p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-sage transition-colors duration-300 group-hover:text-carbon">
          {learnMore}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
