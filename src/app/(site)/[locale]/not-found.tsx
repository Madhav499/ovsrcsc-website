import Link from 'next/link';
import { headers } from 'next/headers';
import { Compass } from 'lucide-react';
import { getDictionary, normalizeLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';

export default async function LocaleNotFound() {
  const requestHeaders = await headers();
  const path = requestHeaders.get('x-ovsrcsc-path') ?? '';
  const locale = normalizeLocale(path.split('/').filter(Boolean)[0] as LocaleCode | undefined);
  const dict = getDictionary(locale);

  return (
    <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-carbon text-warm-ivory">
      <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 top-1/2 size-[520px] -translate-y-1/2 rounded-full border border-warm-ivory/8" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 top-1/2 size-[320px] -translate-y-1/2 rounded-full border border-brass/20" aria-hidden="true" />
      <div className="pointer-events-none absolute right-6 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brass" aria-hidden="true" />

      <div className="site-container relative py-24">
        <p className="eyebrow flex items-center gap-3 text-brass">
          <Compass className="size-4" aria-hidden="true" />
          404
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {dict['notFound.title']}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-warm-ivory/60">
          {dict['notFound.body']}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href={`/${locale}`} className="btn btn-accent">
            {dict['notFound.home']}
          </Link>
          <Link href={`/${locale}/search`} className="btn btn-light">
            {dict['notFound.search']}
          </Link>
        </div>
      </div>
    </section>
  );
}
