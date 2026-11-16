import type { Metadata } from 'next';
import { LOCALES, LOCALE_LABELS, type LocaleCode } from '@/lib/constants';

/** Absolute origin of the public site, without a trailing slash. */
export function siteOrigin(): string {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** `/en/blog` style path for a locale; `path` may be '' or start with '/'. */
export function localePath(locale: LocaleCode, path = ''): string {
  const clean = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Canonical + hreflang alternates for a route that exists in every locale.
 * `path` is the locale-less path, e.g. '/events' or '' for home.
 */
export function localeAlternates(
  locale: LocaleCode,
  path: string,
  available: readonly LocaleCode[] = LOCALES,
): Metadata['alternates'] {
  const origin = siteOrigin();
  const languages: Record<string, string> = {};
  for (const code of available) {
    languages[LOCALE_LABELS[code].htmlLang] = `${origin}${localePath(code, path)}`;
  }
  languages['x-default'] = `${origin}${localePath('en', path)}`;
  return {
    canonical: `${origin}${localePath(locale, path)}`,
    languages,
  };
}

export function sectionLabel(
  section: { nameEn: string; nameGu: string; nameHi: string },
  locale: LocaleCode,
): string {
  if (locale === 'gu') return section.nameGu || section.nameEn;
  if (locale === 'hi') return section.nameHi || section.nameEn;
  return section.nameEn;
}

/** Two-digit index used by editorial section labels: 1 → "01". */
export function indexLabel(value: number): string {
  return String(value).padStart(2, '0');
}

/** Year the center moved into its present building (verified, institution's own site). */
export const ESTABLISHED_YEAR = 1997;

/** Native-digit formatting for numbers shown as editorial figures. */
export function formatNumber(value: number, locale: LocaleCode): string {
  const tag = locale === 'gu' ? 'gu-IN-u-nu-gujr' : locale === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(tag).format(value);
}
