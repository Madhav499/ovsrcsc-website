import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatFileSize, mediaUrl } from '@/lib/media';
import { formatNumber, localeAlternates } from '@/lib/meridian/site';
import { getPublishedDocuments, getPublishedResourceLinks } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { ResourceLibrary } from '@/components/meridian/library/resource-library';

interface DownloadsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DownloadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['downloads.title'],
    description: dict['downloads.intro'],
    alternates: localeAlternates(locale, '/downloads'),
  };
}

function fileType(name: string, mimeType: string): string {
  const extension = name.split('.').pop();
  if (extension && extension !== name && extension.length <= 5) return extension.toUpperCase();
  return mimeType.split('/').pop()?.slice(0, 5).toUpperCase() ?? '';
}

export default async function DownloadsPage({ params }: DownloadsPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [links, documents] = await Promise.all([getPublishedResourceLinks(), getPublishedDocuments()]);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['downloads.title'] }]}
        eyebrow={dict['nav.downloads']}
        title={dict['downloads.title']}
        intro={dict['downloads.intro']}
        motif="meridian"
        meta={
          links.length + documents.length ? (
            <dl className="flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <dt className="mx-mono-label">{dict['downloads.documents']}</dt>
                <dd className="mx-numeric mt-1 text-4xl text-(--mx-amber)">{formatNumber(documents.length, locale)}</dd>
              </div>
              <div>
                <dt className="mx-mono-label">{dict['downloads.links']}</dt>
                <dd className="mx-numeric mt-1 text-4xl">{formatNumber(links.length, locale)}</dd>
              </div>
            </dl>
          ) : undefined
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14">
          <ResourceLibrary
            links={links.map((link) => ({
              id: link.id,
              title: link.title,
              description: link.description,
              url: link.url,
              category: link.category?.trim() || dict['downloads.links'],
              isExternal: link.isExternal,
            }))}
            documents={documents.map((document) => ({
              id: document.id,
              title: document.title || document.originalName,
              fileName: document.originalName,
              href: `${mediaUrl(document.storageKey)}?download=1`,
              type: fileType(document.originalName, document.mimeType),
              size: formatFileSize(document.sizeBytes),
              date: formatDate(document.createdAt, locale),
            }))}
            labels={{
              filter: dict['mx.downloads.filterLabel'],
              placeholder: dict['mx.downloads.filterPlaceholder'],
              noMatch: dict['mx.downloads.noMatch'],
              links: dict['downloads.links'],
              linksNote: dict['downloads.externalNote'],
              documents: dict['downloads.documents'],
              download: dict['common.download'],
              open: dict['mx.downloads.open'],
              newTab: dict['a11y.newTab'],
              empty: dict['downloads.empty'],
            }}
          />
        </div>
      </div>
    </>
  );
}
