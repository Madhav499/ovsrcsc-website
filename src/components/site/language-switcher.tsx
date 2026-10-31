'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { switchLocalePath } from '@/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLocale: LocaleCode;
  label: string;
  light?: boolean;
}

export function LanguageSwitcher({ currentLocale, label, light = false }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border p-0.5',
        light ? 'border-paper/20 bg-paper/5' : 'border-ink/10 bg-paper',
      )}
      aria-label={label}
      role="group"
    >
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
            className={cn(
              'rounded-full px-2 py-1 text-[11px] font-bold leading-none transition-colors',
              active
                ? light
                  ? 'bg-paper text-ink'
                  : 'bg-ink text-paper'
                : light
                  ? 'text-paper/70 hover:text-paper'
                  : 'text-ink-muted hover:text-ink',
            )}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
