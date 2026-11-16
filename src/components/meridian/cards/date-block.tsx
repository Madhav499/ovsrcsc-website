import { formatDate } from '@/lib/dates';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** Calendar-leaf date: large day numeral over month and year. */
export function DateBlock({
  date,
  locale,
  size = 'md',
  className,
}: {
  date: Date;
  locale: LocaleCode;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const day = formatDate(date, locale, { day: 'numeric' });
  const month = formatDate(date, locale, { month: 'short' });
  const year = formatDate(date, locale, { year: 'numeric' });
  const weekday = formatDate(date, locale, { weekday: 'short' });
  return (
    <time
      dateTime={date.toISOString()}
      className={cn('flex shrink-0 flex-col items-start leading-none', className)}
    >
      <span className="mx-mono-label">{weekday}</span>
      <span
        className={cn('mx-numeric mt-2 text-(--mx-fg)', size === 'lg' ? 'text-[4.5rem]' : 'text-[2.75rem]')}
      >
        {day}
      </span>
      <span className="mt-2 text-[0.8125rem] font-semibold text-(--mx-fg-2)">
        {month} {year}
      </span>
    </time>
  );
}
