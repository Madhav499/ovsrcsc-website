import type { LocaleCode } from '@/lib/constants';
import { formatDate, toInstitutionLocalInput } from '@/lib/dates';
import { cn } from '@/lib/utils';

interface RulerEvent {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
}

/**
 * Twelve months from today as a measuring rule. Each scheduled event is a
 * mark on its month; a month with events links to its first event below.
 * With nothing scheduled the rule still reads as an honest, empty calendar.
 */
export function MonthRuler({
  events,
  locale,
  label,
  anchor = (event) => `#event-${event.id}`,
}: {
  events: RulerEvent[];
  locale: LocaleCode;
  label: string;
  anchor?: (event: RulerEvent) => string;
}) {
  // Calendar arithmetic in the institution's time zone (Asia/Kolkata).
  const local = (date: Date) => {
    const [y, m, d] = toInstitutionLocalInput(date).split(/[-T]/).map(Number);
    return { y, m: m - 1, d };
  };
  const today = local(new Date());
  const months = Array.from({ length: 12 }, (_, i) => {
    const y = today.y + Math.floor((today.m + i) / 12);
    const m = (today.m + i) % 12;
    return { y, m, date: new Date(Date.UTC(y, m, 15)) };
  });
  const inMonth = (month: { y: number; m: number }) =>
    events.filter((event) => {
      const at = local(event.startAt);
      return at.y === month.y && at.m === month.m;
    });

  return (
    <nav aria-label={label} className="min-w-0">
      <ol className="grid grid-cols-6 gap-y-6 sm:grid-cols-12">
        {months.map((month, index) => {
          const list = inMonth(month);
          const name = formatDate(month.date, locale, { month: 'short' });
          const yearMark = index === 0 || month.m === 0;
          const body = (
            <>
              <span aria-hidden="true" className="relative block h-10 border-l border-(--mx-line-strong)">
                {list.slice(0, 4).map((event, k) => {
                  const day = local(event.startAt).d;
                  return (
                    <span
                      key={event.id}
                      className="absolute size-2 rounded-full bg-(--mx-mark)"
                      style={{ left: `${(day / 31) * 100}%`, top: `${10 + k * 9}px` }}
                    />
                  );
                })}
              </span>
              <span className={cn('mx-mono-label mt-2 block', list.length > 0 && 'text-(--mx-fg)')}>{name}</span>
              <span className="mx-mono-label block">{yearMark ? formatDate(month.date, locale, { year: 'numeric' }) : ' '}</span>
              {list.length ? <span className="sr-only">: {list.map((event) => event.title).join(', ')}</span> : null}
            </>
          );
          return (
            <li key={`${month.y}-${month.m}`} className="min-w-0">
              {list.length ? (
                <a href={anchor(list[0])} className="block rounded-(--mx-radius-xs) pr-2 transition-colors hover:bg-(--mx-sunken)">
                  {body}
                </a>
              ) : (
                <div className="pr-2">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
