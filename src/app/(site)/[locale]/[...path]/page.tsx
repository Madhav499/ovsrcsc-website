import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import { LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { excerptFromHtml } from '@/lib/sanitize';
import { indexLabel, sectionLabel, siteOrigin } from '@/lib/meridian/site';
import { getPublishedPage, getPublishedSiblingPages } from '@/server/services/pages';
import { getChildPages, getPageBreadcrumbs } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { JsonLd } from '@/components/meridian/primitives/json-ld';
import { Reveal, Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { EmptyState, FallbackNotice } from '@/components/meridian/states/states';

interface ContentPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

const getPageCached = cache(getPublishedPage);

/** Each institutional section gets its own scientific motif. */
const SECTION_MOTIF: Record<string, 'atom' | 'rings' | 'meridian'> = {
  about: 'meridian',
  infrastructure: 'rings',
  activities: 'atom',
  projects: 'atom',
  publications: 'meridian',
};

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { locale: rawLocale, path: segments } = await params;
  if (!isLocale(rawLocale)) return {};
  const path = segments.join('/');
  const result = await getPageCached(path, rawLocale);
  if (!result) return { title: getDictionary(rawLocale)['notFound.title'] };
  const { page, translation } = result;
  const origin = siteOrigin();
  const languages: Record<string, string> = { 'x-default': `${origin}/en/${page.path}` };
  for (const item of page.translations) {
    if (item.status === 'PUBLISHED') {
      const code = item.locale.toLowerCase() as LocaleCode;
      if (LOCALE_LABELS[code]) languages[LOCALE_LABELS[code].htmlLang] = `${origin}/${code}/${page.path}`;
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
    alternates: { canonical: `${origin}/${rawLocale}/${page.path}`, languages },
    openGraph: {
      type: 'article',
      title: translation.seoTitle || translation.title,
      description,
      url: `${origin}/${rawLocale}/${page.path}`,
      modifiedTime: page.updatedAt.toISOString(),
      images: page.coverKey ? [`${origin}/media/${page.coverKey}`] : undefined,
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
  const label = sectionLabel(page.section, locale);
  const intro = translation.summary || excerptFromHtml(translation.bodyHtml, 220) || undefined;
  const hasSidebar = siblings.length > 0;
  const origin = siteOrigin();
  const p = `/${locale}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: translation.title,
        description: intro,
        url: `${origin}${p}/${page.path}`,
        inLanguage: LOCALE_LABELS[locale].htmlLang,
        dateModified: page.updatedAt.toISOString(),
        isPartOf: { '@type': 'WebSite', name: dict['site.name'], url: `${origin}${p}` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: dict['page.breadcrumbHome'], item: `${origin}${p}` },
          ...crumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 2,
            name: crumb.label,
            item: `${origin}${p}${crumb.path}`,
          })),
          { '@type': 'ListItem', position: crumbs.length + 2, name: translation.title },
        ],
      },
    ],
  };

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[
          ...crumbs.map((crumb) => ({ label: crumb.label, href: `${p}${crumb.path}` })),
          { label: translation.title },
        ]}
        eyebrow={label}
        title={translation.title}
        intro={intro}
        motif={SECTION_MOTIF[page.section.key] ?? 'rings'}
        meta={
          <p className="mx-meta inline-flex items-center gap-2">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {dict['page.lastUpdated']}: {formatDate(page.updatedAt, locale)}
          </p>
        }
        aside={
          page.coverKey ? (
            <figure className="mx-plate relative aspect-[4/3] w-full">
              <CmsImage
                storageKey={page.coverKey}
                alt={translation.title}
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
              <span aria-hidden="true" className="mx-ticks" />
            </figure>
          ) : undefined
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14 sm:!pt-20">
          <div
            className={
              hasSidebar
                ? 'grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_22rem]'
                : 'mx-auto max-w-4xl'
            }
          >
            <article className="min-w-0">
              {isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}

              {translation.bodyHtml ? (
                <div className="mx-prose" dangerouslySetInnerHTML={{ __html: translation.bodyHtml }} />
              ) : children.length === 0 ? (
                <EmptyState title={dict['common.noResults']} />
              ) : null}

              {children.length > 0 ? (
                <section aria-labelledby="page-chapters" className="mt-16 border-t border-(--mx-line-strong) pt-10">
                  <p className="mx-eyebrow">{dict['mx.page.chapters']}</p>
                  <h2 id="page-chapters" className="mx-h3 mt-3">
                    {translation.title}
                  </h2>
                  <Stagger className="mt-8 grid gap-5 sm:grid-cols-2">
                    {children.map((child, index) => (
                      <StaggerItem key={child.id}>
                        <Link href={`${p}/${child.path}`} className="mx-card group flex h-full flex-col overflow-hidden">
                          {child.coverKey ? (
                            <div className="mx-plate mx-zoom relative aspect-[16/9] rounded-none">
                              <CmsImage storageKey={child.coverKey} alt="" sizes="(max-width: 640px) 100vw, 30vw" />
                            </div>
                          ) : null}
                          <div className="flex flex-1 flex-col p-6">
                            <span className="mx-mono-label">{indexLabel(index + 1)}</span>
                            <h3 className="mx-h4 mt-2 transition-colors duration-300 group-hover:text-(--mx-accent)">
                              {child.title}
                            </h3>
                            {child.summary ? (
                              <p className="mx-line-clamp-3 mt-2 text-[0.9375rem] text-(--mx-fg-2)">{child.summary}</p>
                            ) : null}
                            <span className="mx-link mt-auto self-start pt-5 text-[0.9375rem]">
                              {dict['common.learnMore']}
                              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                            </span>
                          </div>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              ) : null}
            </article>

            {hasSidebar ? (
              <aside className="min-w-0">
                <div className="grid gap-6 lg:sticky lg:top-[calc(var(--mx-header-h)+1.5rem)]">
                  <nav aria-labelledby="page-section-nav" className="mx-surface-white rounded-(--mx-radius-md) p-6 shadow-[var(--mx-shadow-sm)]">
                    <p id="page-section-nav" className="mx-mono-label">
                      {dict['page.inSection']} · {label}
                    </p>
                    <ol className="mt-4 grid">
                      {siblings.map((sibling, index) => (
                        <li key={sibling.id} className="border-t border-(--mx-line) first:border-t-0">
                          <Link
                            href={`${p}/${sibling.path}`}
                            className="group flex min-h-11 items-baseline gap-3 py-2.5 text-[0.9375rem] font-medium text-(--mx-fg-2) transition-colors hover:text-(--mx-fg)"
                          >
                            <span className="mx-mono-label w-5 shrink-0">{indexLabel(index + 1)}</span>
                            <span className="min-w-0">{sibling.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </nav>

                  <Reveal>
                    <div className="mx-surface-dark relative isolate overflow-hidden rounded-(--mx-radius-md) p-7">
                      <div aria-hidden="true" className="mx-atmosphere absolute inset-0 -z-10" />
                      <p className="mx-h4">{dict['site.tagline']}</p>
                      <p className="mt-3 text-[0.875rem] leading-relaxed text-(--mx-fg-2)">{dict['contact.intro']}</p>
                      <Link href={`${p}/contact`} className="mx-btn mx-btn-primary mx-btn-sm mt-6">
                        {dict['nav.contact']}
                        <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                      </Link>
                    </div>
                  </Reveal>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      <JsonLd data={structuredData} />
    </>
  );
}
