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
        <form action={`/${locale}/search`} method="get" role="search" className="flex gap-2.5">
          <label htmlFor="search-query" className="sr-only">
            {dict['search.placeholder']}
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-cyan"
              aria-hidden="true"
            />
            <input
              id="search-query"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={dict['search.placeholder']}
              className="h-12 w-full rounded-full border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-warm-ivory/50 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30 transition-all backdrop-blur-md"
            />
          </div>
          <button type="submit" className="btn btn-accent !py-3 !px-6 text-xs font-bold uppercase tracking-wider">
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
              <p className="text-sm text-slate-muted font-medium">
                <span className="font-bold text-midnight">{results.length}</span> {dict['search.results']} · {dict['common.resultsFor']}{' '}
                <span className="font-semibold text-midnight">“{query}”</span>
              </p>
              <ul className="mt-6 space-y-4">
                {results.map((result) => (
                  <li key={`${result.type}-${result.href}`}>
                    <Link
                      href={result.href}
                      className="meridian-card group block p-6"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan/15 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan">
                          {dict[TYPE_LABELS[result.type]]}
                        </span>
                        {result.isFallback ? (
                          <span className="rounded-full bg-solar/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-solar">EN</span>
                        ) : null}
                      </span>
                      <span className="mt-2.5 block font-display text-xl font-semibold leading-snug text-midnight group-hover:text-solar transition-colors">
                        {result.title}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-slate-muted">
                        {result.summary}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 group-hover:text-midnight transition-colors">
                        {dict['common.readMore']}
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
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
