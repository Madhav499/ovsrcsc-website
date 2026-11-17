import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, type ReactNode } from 'react';
import { getDictionary, isLocale } from '@/i18n';
import { LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { excerptFromHtml } from '@/lib/sanitize';
import { sectionLabel, siteOrigin } from '@/lib/meridian/site';
import { repairText } from '@/lib/meridian/text';
import { getPublishedPage, getPublishedSiblingPages } from '@/server/services/pages';
import { getChildPages, getPageBreadcrumbs } from '@/server/public/queries';
import { JsonLd } from '@/components/meridian/primitives/json-ld';
import { AboutPage } from '@/components/meridian/templates/about-page';
import { DiscoveryPage } from '@/components/meridian/templates/discovery-page';
import { EditorialPage } from '@/components/meridian/templates/editorial-page';
import { LabsPage } from '@/components/meridian/templates/labs-page';
import { AstronomyExhibit } from '@/components/meridian/templates/astronomy-exhibit';
import type { ContentPageData } from '@/components/meridian/templates/types';

interface ContentPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

const getPageCached = cache(getPublishedPage);

/** Body excerpt for the lede, without a leading heading that repeats the title. */
function leadFromBody(html: string, title: string): string {
  const text = excerptFromHtml(html, 240 + title.length);
  const lead = text.toLowerCase().startsWith(title.toLowerCase()) ? text.slice(title.length).trim() : text;
  return lead.length > 240 ? `${lead.slice(0, 239).trimEnd()}…` : lead;
}

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
    title: repairText(translation.seoTitle || translation.title),
    description: repairText(description),
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
    getPublishedSiblingPages(page.sectionId, locale),
    getChildPages(path, locale),
  ]);
  const label = sectionLabel(page.section, locale);
  const intro = translation.summary || excerptFromHtml(translation.bodyHtml, 220) || undefined;
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

  const data: ContentPageData = {
    locale,
    dict,
    path: page.path,
    title: repairText(translation.title),
    summary: repairText(translation.summary || leadFromBody(translation.bodyHtml, translation.title) || undefined),
    bodyHtml: repairText(translation.bodyHtml),
    coverKey: page.coverKey,
    updatedAt: page.updatedAt,
    isFallback,
    sectionLabel: label,
    sectionKey: page.section.key,
    crumbs: [
      ...crumbs.map((crumb) => ({ label: repairText(crumb.label), href: `${p}${crumb.path}` })),
      { label: repairText(translation.title) },
    ],
    siblings,
    children,
  };

  let content: ReactNode;
  switch (page.path) {
    case 'about':
      content = <AboutPage data={data} />;
      break;
    case 'infrastructure':
      content = <LabsPage data={data} />;
      break;
    case 'projects':
    case 'activities':
      content = <DiscoveryPage data={data} />;
      break;
    case 'projects/big-bang-astronomy-club':
      content = <EditorialPage data={data} afterBody={<AstronomyExhibit dict={dict} />} />;
      break;
    default:
      content = <EditorialPage data={data} />;
  }

  return (
    <>
      {content}
      <JsonLd data={structuredData} />
    </>
  );
}
