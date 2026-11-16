import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowRight, Search } from 'lucide-react';
import { getDictionary, normalizeLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { StatusPanel } from '@/components/meridian/states/status-panel';

export default async function LocaleNotFound() {
  const requestHeaders = await headers();
  const path = requestHeaders.get('x-ovsrcsc-path') ?? '';
  const locale = normalizeLocale(path.split('/').filter(Boolean)[0] as LocaleCode | undefined);
  const dict = getDictionary(locale);

  return (
    <StatusPanel
      code="404"
      title={dict['notFound.title']}
      body={dict['notFound.body']}
      actions={
        <>
          <Link href={`/${locale}`} className="mx-btn mx-btn-primary">
            {dict['notFound.home']}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/search`} className="mx-btn mx-btn-ghost">
            <Search className="size-4" aria-hidden="true" />
            {dict['notFound.search']}
          </Link>
        </>
      }
    />
  );
}
