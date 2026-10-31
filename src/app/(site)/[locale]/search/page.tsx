import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { getDictionary, isLocale, type Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { searchPublicContent, type SearchResult } from '@/server/public/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['search.title'],
    description: dict['search.intro'],
    robots: { index: false, follow: true },
  };
}

const TYPE_LABELS: Record<SearchResult['type'], keyof Dictionary> = {
  page: 'search.type.page',
  notice: 'search.type.notice',
  event: 'search.type.event',
  blog: 'search.type.blog',
};

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const results = query.length >= 2 ? await searchPublicContent(query, locale, 30) : [];

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['search.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.search']}
        title={dict['search.title']}
        intro={dict['search.intro']}
      >
        <form action={`/${locale}/search`} method="get" role="search" className="flex gap-2">
          <label htmlFor="search-query" className="sr-only">
            {dict['search.placeholder']}
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-warm-ivory/40"
              aria-hidden="true"
            />
            <input
              id="search-query"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={dict['search.placeholder']}
              className="h-11 w-full rounded-full border border-warm-ivory/15 bg-warm-ivory/8 pl-9 pr-4 text-sm text-warm-ivory placeholder:text-warm-ivory/40"
            />
          </div>
          <button type="submit" className="btn btn-accent">
            {dict['search.button']}
          </button>
        </form>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          {query.length < 2 ? (
            <EmptyState icon={<Search className="size-5" aria-hidden="true" />}>
              {dict['search.queryEmpty']}
            </EmptyState>
          ) : results.length === 0 ? (
            <EmptyState title={dict['common.noResults']} icon={<Search className="size-5" aria-hidden="true" />}>
              {dict['search.noResults']}
            </EmptyState>
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                {results.length} {dict['search.results']} · {dict['common.resultsFor']}{' '}
                <span className="font-semibold text-ink">“{query}”</span>
              </p>
              <ul className="mt-6 space-y-3">
                {results.map((result) => (
                  <li key={`${result.type}-${result.href}`}>
                    <Link
                      href={result.href}
                      className="group block rounded-2xl border border-line bg-paper p-5 transition-all hover:border-brass/40 hover:shadow-card"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-graphite/8 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sage">
                          {dict[TYPE_LABELS[result.type]]}
                        </span>
                        {result.isFallback ? (
                          <span className="text-[10px] font-semibold text-ink-muted">EN</span>
                        ) : null}
                      </span>
                      <span className="mt-2 block font-display text-lg font-semibold leading-snug text-ink group-hover:text-brass-dark">
                        {result.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-ink-muted">
                        {result.summary}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sage">
                        {dict['common.readMore']}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
