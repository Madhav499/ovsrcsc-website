import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { isSafeHttpUrl } from '@/lib/utils';
import type { PublicEvent } from '@/server/public/queries';
import { EventCard } from '@/components/meridian/cards/event-card';
import { Reveal } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { EmptyState } from '@/components/meridian/states/states';

interface HomeEventsProps {
  locale: LocaleCode;
  dict: Dictionary;
  events: PublicEvent[];
  externalCalendar: string;
}

export function HomeEvents({ locale, dict, events, externalCalendar }: HomeEventsProps) {
  const p = `/${locale}`;
  const [featured, ...rest] = events;
  const calendar = externalCalendar && isSafeHttpUrl(externalCalendar) ? externalCalendar : null;

  return (
    <section aria-labelledby="home-events-title" className="mx-surface-ivory mx-section">
      <div className="mx-container">
        <SectionHeading
          id="home-events-title"
          index="04"
          eyebrow={dict['home.events.eyebrow']}
          title={dict['home.events.title']}
          align="split"
          action={
            <Link href={`${p}/events`} className="mx-btn mx-btn-ink">
              {dict['mx.home.eventsAll']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
          }
          intro={<p>{dict['events.intro']}</p>}
        />

        <div className="mt-14">
          {featured ? (
            <>
              <Reveal>
                <EventCard event={featured} locale={locale} dict={dict} variant="feature" />
              </Reveal>
              {rest.length ? (
                <div className="mt-10 border-b border-(--mx-line)">
                  {rest.slice(0, 3).map((event) => (
                    <EventCard key={event.id} event={event} locale={locale} dict={dict} />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title={dict['home.events.empty']}
              body={<p>{dict['events.intro']}</p>}
              action={
                <>
                  {calendar ? (
                    <a href={calendar} target="_blank" rel="noopener noreferrer" className="mx-btn mx-btn-ink">
                      {dict['home.events.external']}
                      <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                      <span className="sr-only">({dict['a11y.newTab']})</span>
                    </a>
                  ) : null}
                  <Link href={`${p}/events`} className="mx-btn mx-btn-ghost">
                    {dict['events.past']}
                  </Link>
                </>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
