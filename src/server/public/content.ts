import 'server-only';
import type { ContentStatus, Locale } from '@prisma/client';
import { DEFAULT_LOCALE, type LocaleCode } from '@/lib/constants';
import { localeToPrismaLocale } from '@/i18n';
import { localizePath } from '@/i18n';

interface Translatable {
  locale: Locale;
  status?: ContentStatus;
}

export function getPublishedTranslation<T extends Translatable>(
  translations: T[],
  locale: LocaleCode,
): T | null {
  const preferred = localeToPrismaLocale(locale);
  const isPublished = (translation: T) =>
    translation.status === undefined || translation.status === 'PUBLISHED';
  const exact = translations.find(
    (translation) => translation.locale === preferred && isPublished(translation),
  );
  if (exact) return exact;
  const englishLocale = localeToPrismaLocale(DEFAULT_LOCALE);
  return (
    translations.find(
      (translation) => translation.locale === englishLocale && isPublished(translation),
    ) ?? null
  );
}

export function getPublishedTranslationOrAny<T extends Translatable>(
  translations: T[],
  locale: LocaleCode,
): T | null {
  return getPublishedTranslation(translations, locale) ?? translations[0] ?? null;
}

export function isFallbackTranslation(
  translation: Pick<Translatable, 'locale'>,
  locale: LocaleCode,
): boolean {
  return translation.locale !== localeToPrismaLocale(locale);
}

export function publicHref(locale: LocaleCode, path: string): string {
  return localizePath(locale, path);
}

export function contentExcerpt(html: string, max = 180): string {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
