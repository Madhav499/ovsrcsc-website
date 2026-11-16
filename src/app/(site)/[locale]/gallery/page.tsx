import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { formatNumber, indexLabel, localeAlternates } from '@/lib/meridian/site';
import { getPublishedAlbums } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { AlbumOrbit } from '@/components/meridian/gallery/album-orbit';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Reveal } from '@/components/meridian/motion/reveal';
import { EmptyState } from '@/components/meridian/states/states';

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
}

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

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const albums = await getPublishedAlbums(locale);
  const totalPhotos = albums.reduce((sum, album) => sum + album.items.length, 0);
  const p = `/${locale}`;

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['gallery.title'] }]}
        eyebrow={dict['gallery.heroEyebrow']}
        title={dict['gallery.title']}
        intro={dict['gallery.intro']}
        motif="rings"
        meta={
          albums.length ? (
            <dl className="flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <dt className="mx-mono-label">{dict['mx.gallery.albums']}</dt>
                <dd className="mx-numeric mt-1 text-4xl text-(--mx-amber)">{formatNumber(albums.length, locale)}</dd>
              </div>
              <div>
                <dt className="mx-mono-label">{dict['mx.gallery.photographs']}</dt>
                <dd className="mx-numeric mt-1 text-4xl">{formatNumber(totalPhotos, locale)}</dd>
              </div>
            </dl>
          ) : undefined
        }
        aside={
          albums.length >= 3 ? (
            <AlbumOrbit
              albums={albums.map((album) => ({
                id: album.id,
                slug: album.slug,
                title: album.title,
                coverKey: album.coverKey,
              }))}
              locale={locale}
              centre={dict['gallery.heroTitle']}
              note={`${formatNumber(albums.length, locale)} ${dict['mx.gallery.albums']}`}
            />
          ) : undefined
        }
      />

      <section aria-labelledby="album-index" className="mx-surface-ivory mx-section !pt-16">
        <div className="mx-container">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--mx-line-strong) pb-6">
            <h2 id="album-index" className="mx-h3">
              {dict['mx.gallery.index']}
            </h2>
            <p className="mx-meta max-w-md">{dict['gallery.heroLine']}</p>
          </div>

          {albums.length ? (
            <ol className="mt-4">
              {albums.map((album, index) => {
                const flip = index % 2 === 1;
                return (
                  <li key={album.id} className="border-b border-(--mx-line)">
                    <Reveal>
                      <article className="group relative grid gap-8 py-10 md:grid-cols-12 md:items-center md:gap-10 lg:py-14">
                        <div className={cn('md:col-span-7', flip && 'md:order-2')}>
                          <div className="mx-plate mx-zoom relative aspect-[16/10]">
                            {album.coverKey ? (
                              <CmsImage
                                storageKey={album.coverKey}
                                alt=""
                                sizes="(max-width: 768px) 100vw, 58vw"
                                priority={index === 0}
                              />
                            ) : null}
                            <span aria-hidden="true" className="mx-ticks" />
                          </div>
                        </div>
                        <div className={cn('md:col-span-5', flip && 'md:order-1')}>
                          <p className="mx-mono-label">
                            {dict['gallery.plate']} {indexLabel(index + 1)}
                          </p>
                          <h3 className="mx-h2 mt-4" style={{ fontSize: 'clamp(1.6rem, 1.2rem + 1.5vw, 2.5rem)' }}>
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
                          {album.description ? (
                            <p className="mx-line-clamp-3 mt-4 text-(--mx-fg-2)">{album.description}</p>
                          ) : null}
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
          ) : (
            <EmptyState className="mt-10" title={dict['gallery.empty']} />
          )}
        </div>
      </section>
    </>
  );
}
