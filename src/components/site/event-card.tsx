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
      className="meridian-card group flex h-full flex-col overflow-hidden"
    >
      {event.coverKey ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-warm-ivory">
          <AppImage
            storageKey={event.coverKey}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 rounded-md bg-midnight/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan backdrop-blur-md">
            {event.sectionName}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-midnight px-6 py-7 text-warm-ivory border-b border-cosmic">
          <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border border-cyan/10" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">
              {event.sectionName}
            </p>
            <p className="mt-4 font-display text-4xl font-semibold leading-none text-white tabular-nums">
              {formatDate(event.startAt, locale, { day: '2-digit' })}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-solar">
              {formatDate(event.startAt, locale, { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-teal-600" aria-hidden="true" />
            {formatEventRange(event.startAt, event.endAt, locale, event.allDay)}
          </span>
        </div>
        <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-midnight transition-colors duration-300 group-hover:text-solar">
          {event.title}
        </h3>
        {event.location ? (
          <p className="mt-2.5 inline-flex items-start gap-1.5 text-xs text-slate-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-teal-600" aria-hidden="true" />
            {event.location}
          </p>
        ) : null}
        <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors group-hover:text-midnight">
          {learnMore}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
