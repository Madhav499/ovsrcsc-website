import { INSTITUTION_TIME_ZONE, type LocaleCode } from './constants';

const INTL_LOCALES: Record<LocaleCode, string> = {
  en: 'en-IN',
  gu: 'gu-IN',
  hi: 'hi-IN',
};

export const KOLKATA_OFFSET_MINUTES = 330;

export function parseInstitutionLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? '0');
  const minute = Number(match[5] ?? '0');
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const utc = Date.UTC(year, month - 1, day, hour, minute) - KOLKATA_OFFSET_MINUTES * 60_000;
  const date = new Date(utc);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function toInstitutionLocalInput(date: Date | null | undefined): string {
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INSTITUTION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

export function toInstitutionDateInput(date: Date | null | undefined): string {
  if (!date) return '';
  return toInstitutionLocalInput(date).slice(0, 10);
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: LocaleCode,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  if (!date) return '';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    timeZone: INSTITUTION_TIME_ZONE,
    ...options,
  }).format(value);
}

export function formatDateTime(
  date: Date | string | null | undefined,
  locale: LocaleCode,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

export function formatEventRange(
  start: Date,
  end: Date | null | undefined,
  locale: LocaleCode,
  allDay = false,
): string {
  const dateFormatter = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    timeZone: INSTITUTION_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    timeZone: INSTITUTION_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
  if (allDay) {
    if (end && dateFormatter.format(end) !== dateFormatter.format(start)) {
      return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
    }
    return dateFormatter.format(start);
  }
  if (!end) return `${dateFormatter.format(start)}, ${timeFormatter.format(start)}`;
  const sameDay = dateFormatter.format(start) === dateFormatter.format(end);
  if (sameDay) {
    return `${dateFormatter.format(start)}, ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }
  return `${dateFormatter.format(start)}, ${timeFormatter.format(start)} – ${dateFormatter.format(end)}, ${timeFormatter.format(end)}`;
}

export function isSameInstitutionDay(a: Date, b: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: INSTITUTION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(a) === formatter.format(b);
}

export function startOfInstitutionDay(date: Date): Date {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: INSTITUTION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parseInstitutionLocal(`${formatted}T00:00`) ?? date;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}
