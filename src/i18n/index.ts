import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from '@/lib/constants';
import { en, type Dictionary } from './en';
import { gu } from './gu';
import { hi } from './hi';

export type { Dictionary } from './en';

export const dictionaries: Record<LocaleCode, Dictionary> = { en, gu, hi };

export function isLocale(value: string | undefined | null): value is LocaleCode {
  return Boolean(value && (LOCALES as readonly string[]).includes(value));
}

export function normalizeLocale(value: string | undefined | null): LocaleCode {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: LocaleCode): Dictionary {
  return dictionaries[locale];
}

export function createTranslator(locale: LocaleCode) {
  const dictionary = getDictionary(locale);
  return (key: keyof Dictionary): string => dictionary[key] ?? en[key] ?? String(key);
}

export type Translator = ReturnType<typeof createTranslator>;

export function localeToPrismaLocale(locale: LocaleCode): 'EN' | 'GU' | 'HI' {
  return locale.toUpperCase() as 'EN' | 'GU' | 'HI';
}

export function prismaLocaleToLocale(locale: 'EN' | 'GU' | 'HI'): LocaleCode {
  return locale.toLowerCase() as LocaleCode;
}

export function localizePath(locale: LocaleCode, path: string): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean}`;
}

export function switchLocalePath(pathname: string, nextLocale: LocaleCode): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join('/')}`;
  }
  return localizePath(nextLocale, pathname);
}
