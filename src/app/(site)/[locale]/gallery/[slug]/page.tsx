import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Images, Telescope } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { getAlbumBySlug, getPublishedAlbums } from '@/server/public/queries';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FallbackNotice } from '@/components/ui/fallback-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { AppImage } from '@/components/ui/app-image';
import { GalleryGrid } from '@/components/site/gallery-grid';
import { OrbitVisualization } from '@/components/site/orbit-visualization';

interface AlbumPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const album = await getAlbumBySlug(slug, rawLocale);
  if (!album) return { title: 'Album not found' };
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: album.title,
    description: album.description || undefined,
    alternates: { canonical: `${appUrl}/${rawLocale}/gallery/${slug}` },
    openGraph: {
      title: album.title,
      description: album.description || undefined,
      url: `${appUrl}/${rawLocale}/gallery/${slug}`,
    },
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const album = await getAlbumBySlug(slug, locale);
  if (!album) notFound();
  const albums = await getPublishedAlbums(locale);
  const stations = albums.filter((candidate) => candidate.id !== album.id).slice(0, 4);

  return (
    <>
      {/* ─── Observatory header band ─── */}
      <div className="relative overflow-hidden bg-carbon text-warm-ivory">
        <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="site-container relative">
          <div className="pt-6">
            <Breadcrumbs
              locale={locale}
              homeLabel={dict['page.breadcrumbHome']}
              ariaLabel={dict['nav.breadcrumb']}
              items={[
                { label: dict['gallery.heroEyebrow'], href: `/${locale}/gallery` },
                { label: album.title },
              ]}
            />
          </div>

          <div className="grid gap-10 py-12 lg:grid-cols-[1fr_auto] lg:items-end lg:py-16">
            <div>
              <p className="eyebrow !text-brass">
                <Telescope className="mr-2 inline size-3.5" aria-hidden="true" />
                {dict['gallery.heroEyebrow']}
              </p>
              <h1 className="display-title mt-5 max-w-3xl text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium text-warm-ivory">
                {album.title}
              </h1>
              {album.description ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-warm-ivory/55">
                  {album.description}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-warm-ivory/45">
                {album.eventDate ? (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-brass" aria-hidden="true" />
                    {formatDate(album.eventDate, locale)}
                  </span>
                ) : null}
                <span className="flex items-center gap-2">
                  <Images className="size-3.5 text-brass" aria-hidden="true" />
                  {album.items.length} {dict['gallery.photos']}
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <OrbitVisualization rings={3} className="size-40" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Exhibition space ─── */}
      <div className="site-container py-12 lg:py-16">
        {album.isFallback ? (
          <div className="mb-8">
            <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
          </div>
        ) : null}

        {album.items.length > 0 ? (
          <GalleryGrid
            items={album.items.map((item) => ({
              id: item.id,
              storageKey: item.storageKey,
              width: item.width,
              height: item.height,
              altText: item.altText,
              caption: item.caption,
            }))}
            labels={{
              open: dict['a11y.openImage'],
              close: dict['gallery.closeExhibition'],
              previous: dict['gallery.prevPlate'],
              next: dict['gallery.nextPlate'],
              exhibition: dict['gallery.viewExhibition'],
              closeExhibition: dict['gallery.closeExhibition'],
              plate: dict['gallery.plate'],
            }}
          />
        ) : (
          <div className="py-20">
            <EmptyState icon={<Images className="size-5" aria-hidden="true" />}>
              {dict['gallery.empty']}
            </EmptyState>
          </div>
        )}

        <div className="separator mt-12" />

        <Link
          href={`/${locale}/gallery`}
          className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sage transition-colors hover:text-carbon"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
          {dict['gallery.backToGallery']}
        </Link>
      </div>

      {/* ─── Nearby stations ─── */}
      {stations.length > 0 ? (
        <section className="border-t border-line bg-paper" aria-label={dict['gallery.orbitSection']}>
          <div className="site-container py-14 lg:py-20">
            <p className="eyebrow">{dict['gallery.orbitSection']}</p>
            <h2 className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-ink sm:text-3xl">
              {dict['gallery.title']}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              {dict['gallery.orbitHint']}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stations.map((station, index) => (
                <Link
                  key={station.id}
                  href={`/${locale}/gallery/${station.slug}`}
                  className="group relative overflow-hidden rounded-xl bg-graphite text-warm-ivory"
                >
                  <span className="image-reveal relative block aspect-[4/3]">
                    {station.coverKey ? (
                      <AppImage
                        storageKey={station.coverKey}
                        alt={station.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                        className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <span className="grid size-full place-items-center bg-graphite text-stone/40">
                        <Images className="size-6" aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/10 to-transparent" aria-hidden="true" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block font-display text-[10px] font-bold tracking-[0.24em] text-brass tabular-nums">
                      {String(index + 1).padStart(2, '0')} · {station.items.length} {dict['gallery.photos']}
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate font-display text-base font-medium">
                        {station.title}
                      </span>
                      <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
