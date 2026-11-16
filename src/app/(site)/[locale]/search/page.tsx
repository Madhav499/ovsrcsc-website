import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { getDictionary, isLocale, type Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatNumber } from '@/lib/meridian/site';
import { searchPublicContent, type SearchResult } from '@/server/public/queries';
import { Breadcrumbs } from '@/components/meridian/layout/breadcrumbs';
import { EmptyState } from '@/components/meridian/states/states';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
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

const TYPES: SearchResult['type'][] = ['page', 'event', 'notice', 'blog'];

function typeLabel(type: SearchResult['type'], dict: Dictionary): string {
  return dict[`search.type.${type}` as keyof Dictionary];
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const { q, type: rawType } = await searchParams;
  const query = (q ?? '').trim();
  const results = query.length >= 2 ? await searchPublicContent(query, locale, 30) : [];
  const type = TYPES.find((candidate) => candidate === rawType) ?? null;
  const visible = type ? results.filter((result) => result.type === type) : results;
  const counts = TYPES.map((candidate) => ({
    type: candidate,
    count: results.filter((result) => result.type === candidate).length,
  })).filter((entry) => entry.count > 0);
  const p = `/${locale}`;
  const base = `${p}/search?q=${encodeURIComponent(query)}`;

  const suggestions = [
    { label: dict['nav.projects'], href: `${p}/projects` },
    { label: dict['nav.events'], href: `${p}/events` },
    { label: dict['nav.gallery'], href: `${p}/gallery` },
    { label: dict['nav.notices'], href: `${p}/notices` },
    { label: dict['nav.downloads'], href: `${p}/downloads` },
  ];

  return (
    <>
      <header data-mx-hero="dark" className="mx-surface-dark relative isolate overflow-hidden">
        <div aria-hidden="true" className="mx-atmosphere pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden="true" className="mx-gridlines pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="mx-container mx-hero-offset pb-14 sm:pb-20">
          <Breadcrumbs
            homeHref={p}
            homeLabel={dict['page.breadcrumbHome']}
            ariaLabel={dict['nav.breadcrumb']}
            items={[{ label: dict['search.title'] }]}
          />
          <h1 className="mx-h1 mt-10 lg:mt-14">{dict['search.title']}</h1>
          <p className="mx-lede mt-5 max-w-2xl">{dict['search.intro']}</p>
          <form action={`${p}/search`} method="get" role="search" className="mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label htmlFor="search-query" className="sr-only">
              {dict['search.prompt']}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-(--mx-fg-3)" aria-hidden="true" />
              <input
                id="search-query"
                name="q"
                type="search"
                defaultValue={query}
                minLength={2}
                required
                placeholder={dict['search.placeholder']}
                className="mx-input !min-h-14 !pl-12 !text-lg"
              />
            </div>
            <button type="submit" className="mx-btn mx-btn-primary !min-h-14">
              {dict['search.button']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14">
          {query.length < 2 ? (
            <div className="max-w-3xl">
              <p className="text-(--mx-fg-2)">{dict['search.queryEmpty']}</p>
              <p className="mx-mono-label mt-10">{dict['mx.search.suggestions']}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="mx-chip">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length ? (
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <p className="mx-meta" aria-live="polite">
                  {formatNumber(results.length, locale)} {dict['search.results']} · {dict['common.resultsFor']} “{query}”
                </p>
                <nav aria-label={dict['common.filterBy']} className="mt-5">
                  <ul className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                    <li>
                      <Link href={base} className="mx-chip" aria-current={!type ? 'true' : undefined} scroll={false}>
                        {dict['mx.search.all']} · {formatNumber(results.length, locale)}
                      </Link>
                    </li>
                    {counts.map((entry) => (
                      <li key={entry.type}>
                        <Link
                          href={`${base}&type=${entry.type}`}
                          className="mx-chip"
                          aria-current={type === entry.type ? 'true' : undefined}
                          scroll={false}
                        >
                          {typeLabel(entry.type, dict)} · {formatNumber(entry.count, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <ol className="border-b border-(--mx-line) lg:col-span-9">
                {visible.map((result) => (
                  <li key={result.href} className="border-t border-(--mx-line)">
                    <Link href={result.href} className="group grid gap-2 py-7 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-8">
                      <span className="mx-mono-label pt-1 text-(--mx-accent)">{typeLabel(result.type, dict)}</span>
                      <span className="min-w-0">
                        <span className="mx-h4 block transition-colors duration-300 group-hover:text-(--mx-accent)">{result.title}</span>
                        {result.summary ? (
                          <span className="mx-line-clamp-2 mt-2 block text-[0.9375rem] text-(--mx-fg-2)">{result.summary}</span>
                        ) : null}
                        {result.isFallback ? <span className="mx-meta mt-2 block">{dict['mx.search.englishVersion']}</span> : null}
                      </span>
                      <ArrowRight
                        className="hidden size-5 self-center text-(--mx-fg-3) transition-transform duration-300 group-hover:translate-x-1 group-hover:text-(--mx-fg) sm:block"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <EmptyState
              title={dict['common.noResults']}
              body={<p>{dict['search.noResults']}</p>}
              action={suggestions.slice(0, 3).map((item) => (
                <Link key={item.href} href={item.href} className="mx-chip">
                  {item.label}
                </Link>
              ))}
            />
          )}
        </div>
      </div>
    </>
  );
}
