'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { switchLocalePath } from '@/i18n';
import { cn } from '@/lib/utils';

const SHORT_LABELS: Record<LocaleCode, string> = { en: 'EN', gu: 'ગુ', hi: 'हि' };

interface LanguageSwitcherProps {
  currentLocale: LocaleCode;
  label: string;
  /** 'short' shows EN · ગુ · हि; 'full' shows the native language names. */
  display?: 'short' | 'full';
  className?: string;
}

/** Switches to the equivalent route in another language, keeping the query string. */
export function LanguageSwitcher({
  currentLocale,
  label,
  display = 'short',
  className,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <div role="group" aria-label={label} className={cn('mx-lang', className)}>
      {LOCALES.map((locale) => {
        const href = `${switchLocalePath(pathname, locale)}${query ? `?${query}` : ''}`;
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={LOCALE_LABELS[locale].htmlLang}
            lang={LOCALE_LABELS[locale].htmlLang}
            aria-current={active ? 'true' : undefined}
            aria-label={LOCALE_LABELS[locale].native}
            title={LOCALE_LABELS[locale].native}
            scroll={false}
          >
            {display === 'full' ? LOCALE_LABELS[locale].native : SHORT_LABELS[locale]}
          </Link>
        );
      })}
    </div>
  );
}
