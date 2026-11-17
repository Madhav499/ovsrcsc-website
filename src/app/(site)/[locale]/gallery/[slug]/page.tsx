import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatNumber, siteOrigin } from '@/lib/meridian/site';
import { getAlbumBySlug, getPublishedAlbums } from '@/server/public/queries';
import { repairText } from '@/lib/meridian/text';
import { ArchiveViews } from '@/components/meridian/gallery/archive-views';
import { ScienceFigure } from '@/components/meridian/journal/figures';
import { EditorialHero } from '@/components/meridian/templates/editorial-hero';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { EmptyState, FallbackNotice } from '@/components/meridian/states/states';

interface AlbumPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const album = await getAlbumBySlug(slug, rawLocale);
  if (!album) return { title: getDictionary(rawLocale)['notFound.title'] };
  const origin = siteOrigin();
  return {
    title: album.title,
    description: album.description || undefined,
    alternates: { canonical: `${origin}/${rawLocale}/gallery/${slug}` },
    openGraph: {
      title: album.title,
      description: album.description || undefined,
      images: album.coverKey ? [`${origin}/media/${album.coverKey}`] : undefined,
    },
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const albums = (await getPublishedAlbums(locale)).map((entry) => ({ ...entry, title: repairText(entry.title), description: repairText(entry.description) }));
  const album = albums.find((candidate) => candidate.slug === slug);
  if (!album) notFound();
  const related = albums.filter((candidate) => candidate.id !== album.id).slice(0, 3);
  const p = `/${locale}`;

  return (
    <>
      <EditorialHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['gallery.title'], href: `${p}/gallery` }, { label: album.title }]}
        eyebrow={dict['gallery.album']}
        title={album.title}
        lede={album.description || dict['gallery.intro']}
        folio={[
          album.eventDate ? formatDate(album.eventDate, locale) : dict['mx.brand.familiar'],
          `${formatNumber(album.items.length, locale)} ${dict['gallery.photos']}`,
        ]}
      />

      <section aria-label={album.title} className="mx-surface-ivory mx-section !pt-14">
        <div className="mx-container">
          {album.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
          {album.items.length ? (
            <ArchiveViews
              items={album.items}
              plateLabel={dict['mx.gallery.plate']}
              dateline={album.eventDate ? formatDate(album.eventDate, locale) : undefined}
              viewLabels={{ group: dict['mx.gallery.views'], editorial: dict['mx.gallery.viewEditorial'], sheet: dict['mx.gallery.viewSheet'] }}
              marginFigure={
                <div>
                  <ScienceFigure name="lens" dict={dict} number={1} />
                  <p className="mt-4 text-[0.875rem] text-(--mx-fg-2)">{dict['mx.gallery.lensNote']}</p>
                </div>
              }
              labels={{
                open: dict['a11y.openImage'],
                close: dict['a11y.closeImage'],
                previous: dict['a11y.previousImage'],
                next: dict['a11y.nextImage'],
                counter: dict['mx.gallery.counter'],
                of: dict['common.of'],
                viewer: dict['gallery.exhibition'],
                fullSize: dict['mx.gallery.fullSize'],
                newTab: dict['a11y.newTab'],
              }}
            />
          ) : (
            <EmptyState title={dict['gallery.empty']} />
          )}
          <Link href={`${p}/gallery`} className="mx-btn mx-btn-ghost mt-14">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {dict['gallery.backToGallery']}
          </Link>
        </div>
      </section>

      {related.length ? (
        <section aria-labelledby="related-albums" className="mx-surface-white mx-section">
          <div className="mx-container">
            <h2 id="related-albums" className="mx-h3">
              {dict['mx.gallery.related']}
            </h2>
            <Stagger className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <StaggerItem key={item.id}>
                  <Link href={`${p}/gallery/${item.slug}`} className="group block">
                    <div className="mx-plate mx-zoom relative aspect-[4/3]">
                      {item.coverKey ? <CmsImage storageKey={item.coverKey} alt="" sizes="(max-width: 640px) 100vw, 33vw" /> : null}
                    </div>
                    <h3 className="mx-h4 mt-4 transition-colors duration-300 group-hover:text-(--mx-accent)">{item.title}</h3>
                    <p className="mx-meta mt-1">
                      {formatNumber(item.items.length, locale)} {dict['gallery.photos']}
                    </p>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}
    </>
  );
}
