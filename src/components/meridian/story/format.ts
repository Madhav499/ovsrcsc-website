import type { LocaleCode } from '@/lib/constants';

/** Native-digit number tags: Gujarati digits for gu, Latin digits otherwise. */
export const NUMBER_TAG: Record<LocaleCode, string> = {
  en: 'en-IN',
  gu: 'gu-IN-u-nu-gujr',
  hi: 'hi-IN',
};

export function formatFixed(value: number, locale: LocaleCode, digits: number): string {
  return new Intl.NumberFormat(NUMBER_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
