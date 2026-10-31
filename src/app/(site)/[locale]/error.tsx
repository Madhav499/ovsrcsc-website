'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { getDictionary, normalizeLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';

export default function LocaleError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale = normalizeLocale(params.locale as LocaleCode | undefined);
  const dict = getDictionary(locale);

  return (
    <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-carbon text-warm-ivory">
      <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 top-1/2 size-[520px] -translate-y-1/2 rounded-full border border-warm-ivory/8" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-20 top-1/2 size-[320px] -translate-y-1/2 rounded-full border border-brass/20" aria-hidden="true" />
      <div className="pointer-events-none absolute left-6 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brass" aria-hidden="true" />

      <div className="site-container relative py-24">
        <div className="max-w-2xl">
          <p className="eyebrow text-brass">{dict['error.title']}</p>
          <h1 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            {dict['notFound.title']}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-warm-ivory/60">
            {dict['error.body']}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn btn-accent">
              <RotateCcw className="size-4" aria-hidden="true" />
              {dict['error.retry']}
            </button>
            <Link href={`/${locale}`} className="btn btn-light">
              {dict['notFound.home']}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
