import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowRight, CalendarDays, Layers } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { absoluteUrl } from '@/lib/utils';
import { excerptFromHtml } from '@/lib/sanitize';
import { getPublishedPage, getPublishedSiblingPages } from '@/server/services/pages';
import { getChildPages, getPageBreadcrumbs } from '@/server/public/queries';
import { AppImage } from '@/components/ui/app-image';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FallbackNotice } from '@/components/ui/fallback-notice';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface ContentPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

const getPageCached = cache(getPublishedPage);

function sectionLabel(
  section: { nameEn: string; nameGu: string; nameHi: string },
  locale: LocaleCode,
): string {
  if (locale === 'gu') return section.nameGu || section.nameEn;
  if (locale === 'hi') return section.nameHi || section.nameEn;
  return section.nameEn;
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { locale: rawLocale, path: segments } = await params;
  if (!isLocale(rawLocale)) return {};
  const path = segments.join('/');
  const result = await getPageCached(path, rawLocale);
  if (!result) return { title: 'Page not found' };
  const { page, translation } = result;
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const languages: Record<string, string> = { 'x-default': `${appUrl}/en/${page.path}` };
  for (const item of page.translations) {
    if (item.status === 'PUBLISHED') {
      const code = item.locale.toLowerCase();
      languages[`${code}-IN`] = `${appUrl}/${code}/${page.path}`;
    }
  }
  const description =
    translation.seoDescription ||
    translation.summary ||
    excerptFromHtml(translation.bodyHtml, 160) ||
    undefined;
  return {
    title: translation.seoTitle || translation.title,
    description,
    alternates: {
      canonical: `${appUrl}/${rawLocale}/${page.path}`,
      languages,
    },
    openGraph: {
      type: 'article',
      title: translation.seoTitle || translation.title,
      description,
      url: `${appUrl}/${rawLocale}/${page.path}`,
      modifiedTime: page.updatedAt.toISOString(),
    },
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { locale: rawLocale, path: segments } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const path = segments.join('/');
  const dict = getDictionary(locale);
  const result = await getPageCached(path, locale);
  if (!result) notFound();

  const { page, translation, isFallback } = result;
  const [crumbs, siblings, children] = await Promise.all([
    getPageBreadcrumbs(path, locale),
    getPublishedSiblingPages(page.sectionId, locale, page.id),
    getChildPages(path, locale),
  ]);
  const hasSidebar = siblings.length > 0 || children.length > 0;
  const label = sectionLabel(page.section, locale);
  const description =
    translation.summary || excerptFromHtml(translation.bodyHtml, 220) || undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: translation.title,
    description,
    url: absoluteUrl(`/${locale}/${page.path}`),
    inLanguage: locale,
    dateModified: page.updatedAt.toISOString(),
    isPartOf: {
      '@type': 'WebSite',
      name: dict['site.name'],
      url: absoluteUrl(`/${locale}`),
    },
  };

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[
            ...crumbs.map((crumb) => ({ label: crumb.label, href: `/${locale}${crumb.path}` })),
            { label: translation.title },
          ]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={label}
        title={translation.title}
        intro={description}
      />

      <div className="site-container py-12 lg:py-16">
        <div
          className={
            hasSidebar
              ? 'grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14'
              : 'grid gap-10'
          }
        >
          <article className="min-w-0">
            {isFallback ? (
              <div className="mb-7">
                <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
              </div>
            ) : null}

            {page.coverKey ? (
              <div className="relative mb-9 aspect-[16/8] overflow-hidden rounded-3xl bg-graphite shadow-card">
                <AppImage
                  storageKey={page.coverKey}
                  alt={translation.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
            ) : null}

            {translation.bodyHtml ? (
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: translation.bodyHtml }}
              />
            ) : (
              <EmptyState icon={<Layers className="size-5" aria-hidden="true" />}>
                {dict['common.noResults']}
              </EmptyState>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-5 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {dict['page.lastUpdated']}: {formatDate(page.updatedAt, locale)}
              </span>
            </div>

            {children.length > 0 ? (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-semibold">{label}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/${locale}/${child.path}`}
                      className="group flex flex-col rounded-2xl border border-line bg-paper p-5 transition-all hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-card"
                    >
                      <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-brass-dark">
                        {child.title}
                      </h3>
                      {child.summary ? (
                        <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{child.summary}</p>
                      ) : null}
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sage">
                        {dict['common.learnMore']}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          {hasSidebar ? (
            <aside className="space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sage">
                  {dict['page.inSection']} {label}
                </p>
                <ul className="mt-3 space-y-1">
                  {siblings.map((sibling) => (
                    <li key={sibling.id}>
                      <Link
                        href={`/${locale}/${sibling.path}`}
                        className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-cream hover:text-ink"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brass" />
                        {sibling.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {children.length > 0 ? (
                <div className="rounded-2xl border border-line bg-graphite/5 p-5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sage">
                    {dict['page.onThisPage']}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {children.slice(0, 8).map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/${locale}/${child.path}`}
                          className="text-sm font-semibold text-ink-soft hover:text-brass-dark"
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-2xl bg-ink p-5 text-paper">
                <p className="font-display text-lg font-semibold">{dict['site.tagline']}</p>
                <p className="mt-2 text-xs leading-relaxed text-paper/60">
                  {dict['footer.about']}
                </p>
                <Link
                  href={`/${locale}/contact`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brass"
                >
                  {dict['nav.contact']}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
