import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { formatNumber, indexLabel, localeAlternates } from '@/lib/meridian/site';
import { repairText } from '@/lib/meridian/text';
import { getPublishedAlbums } from '@/server/public/queries';
import { AlbumOrbit } from '@/components/meridian/gallery/album-orbit';
import { EditorialArchive } from '@/components/meridian/gallery/editorial-archive';
import { ScienceFigure } from '@/components/meridian/journal/figures';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Reveal } from '@/components/meridian/motion/reveal';
import { EmptyState } from '@/components/meridian/states/states';
import { EditorialHero } from '@/components/meridian/templates/editorial-hero';

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
}

/** How many plates the index shows from the lead album before "see every photograph". */
const SELECTION = 9;

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['gallery.title'],
    description: dict['gallery.intro'],
    alternates: localeAlternates(locale, '/gallery'),
  };
}

/**
 * The editorial science archive. The page adapts to what the CMS holds:
 * a curated selection from the lead album in an editorial sequence, then —
 * only when there is more than one album — an index of every album.
 */
export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const albums = (await getPublishedAlbums(locale)).map((album) => ({
    ...album,
    title: repairText(album.title),
    description: repairText(album.description),
  }));
  const totalPhotos = albums.reduce((sum, album) => sum + album.items.length, 0);
  const lead = albums.find((album) => album.items.length) ?? null;
  const p = `/${locale}`;
  const lightboxLabels = {
    open: dict['a11y.openImage'],
    close: dict['a11y.closeImage'],
    previous: dict['a11y.previousImage'],
    next: dict['a11y.nextImage'],
    counter: dict['mx.gallery.counter'],
    of: dict['common.of'],
    viewer: dict['gallery.exhibition'],
    fullSize: dict['mx.gallery.fullSize'],
    newTab: dict['a11y.newTab'],
  };

  return (
    <>
      <EditorialHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['gallery.title'] }]}
        eyebrow={dict['gallery.heroEyebrow']}
        title={dict['gallery.title']}
        lede={dict['gallery.intro']}
        folio={
          albums.length
            ? [
                albums.length > 1 ? `${formatNumber(albums.length, locale)} ${dict['mx.gallery.albums']}` : null,
                `${formatNumber(totalPhotos, locale)} ${dict['mx.gallery.photographs']}`,
                dict['mx.brand.familiar'],
              ].filter(Boolean)
            : [dict['mx.brand.familiar']]
        }
        aside={
          albums.length >= 3 ? (
            <AlbumOrbit
              albums={albums.map((album) => ({ id: album.id, slug: album.slug, title: album.title, coverKey: album.coverKey }))}
              locale={locale}
              centre={dict['gallery.heroTitle']}
              note={`${formatNumber(albums.length, locale)} ${dict['mx.gallery.albums']}`}
            />
          ) : undefined
        }
      />

      {lead ? (
        <section aria-labelledby="gallery-selection" className="mx-surface-ivory mx-section !pt-16">
          <div className="mx-container">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-(--mx-line-strong) pb-6">
              <div>
                <p className="mx-eyebrow">
                  <span className="mx-eyebrow-index">01</span>
                  {dict['mx.gallery.selection']}
                </p>
                <h2 id="gallery-selection" className="mx-h2 mt-4">
                  {lead.title}
                </h2>
              </div>
              <p className="mx-meta flex flex-wrap gap-x-3">
                {lead.eventDate ? <span>{formatDate(lead.eventDate, locale)}</span> : null}
                <span>
                  {formatNumber(lead.items.length, locale)} {dict['gallery.photos']}
                </span>
              </p>
            </div>
            <EditorialArchive
              items={lead.items.slice(0, SELECTION)}
              labels={lightboxLabels}
              plateLabel={dict['mx.gallery.plate']}
              dateline={lead.eventDate ? formatDate(lead.eventDate, locale) : undefined}
              marginFigure={
                <div>
                  <ScienceFigure name="lens" dict={dict} number={1} />
                  <p className="mt-4 text-[0.875rem] text-(--mx-fg-2)">{dict['mx.gallery.lensNote']}</p>
                </div>
              }
            />
            {lead.items.length > SELECTION ? (
              <div className="mt-20 flex justify-center">
                <Link href={`${p}/gallery/${lead.slug}`} className="mx-btn mx-btn-primary">
                  {dict['mx.gallery.viewAll']} · {formatNumber(lead.items.length, locale)}
                  <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="mx-surface-ivory mx-section">
          <div className="mx-container">
            <EmptyState title={dict['gallery.empty']} body={<ScienceFigure name="lens" dict={dict} className="mt-6 max-w-md" />} />
          </div>
        </section>
      )}

      {albums.length > 1 ? (
        <section aria-labelledby="album-index" className="mx-surface-stone mx-grain mx-section">
          <div className="mx-container">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--mx-line-strong) pb-6">
              <h2 id="album-index" className="mx-h3">
                {dict['mx.gallery.index']}
              </h2>
              <p className="mx-meta max-w-md">{dict['gallery.heroLine']}</p>
            </div>
            <ol className="mt-4">
              {albums.map((album, index) => {
                const flip = index % 2 === 1;
                return (
                  <li key={album.id} className="border-b border-(--mx-line)">
                    <Reveal>
                      <article className="group relative grid gap-8 py-10 md:grid-cols-12 md:items-center md:gap-10 lg:py-14">
                        <div className={cn('md:col-span-7', flip && 'md:order-2')}>
                          <div className="mx-plate mx-zoom relative aspect-[16/10]">
                            {album.coverKey ? <CmsImage storageKey={album.coverKey} alt="" sizes="(max-width: 768px) 100vw, 58vw" /> : null}
                            <span aria-hidden="true" className="mx-ticks" />
                          </div>
                        </div>
                        <div className={cn('md:col-span-5', flip && 'md:order-1')}>
                          <p className="mx-mono-label">
                            {dict['gallery.plate']} {indexLabel(index + 1)}
                          </p>
                          <h3 className="mx-h2 mt-4">
                            <Link href={`${p}/gallery/${album.slug}`} className="after:absolute after:inset-0">
                              {album.title}
                            </Link>
                          </h3>
                          <p className="mx-meta mt-4 flex flex-wrap gap-x-3">
                            {album.eventDate ? <span>{formatDate(album.eventDate, locale)}</span> : null}
                            <span>
                              {formatNumber(album.items.length, locale)} {dict['gallery.photos']}
                            </span>
                          </p>
                          {album.description ? <p className="mx-line-clamp-3 mt-4 text-(--mx-fg-2)">{album.description}</p> : null}
                          <span className="mx-link mt-7">
                            {dict['gallery.viewAlbum']}
                            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                          </span>
                        </div>
                      </article>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  );
}
