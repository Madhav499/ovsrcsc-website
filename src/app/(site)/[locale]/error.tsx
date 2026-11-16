'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { getDictionary, normalizeLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { StatusPanel } from '@/components/meridian/states/status-panel';

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
    <StatusPanel
      code="!"
      title={dict['error.title']}
      body={dict['error.body']}
      actions={
        <>
          <button type="button" onClick={reset} className="mx-btn mx-btn-primary">
            <RotateCcw className="size-4" aria-hidden="true" />
            {dict['error.retry']}
          </button>
          <Link href={`/${locale}`} className="mx-btn mx-btn-ghost">
            {dict['notFound.home']}
          </Link>
        </>
      }
    />
  );
}
