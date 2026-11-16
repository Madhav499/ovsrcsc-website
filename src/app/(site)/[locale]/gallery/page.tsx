import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, Images, MoveDown } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { getPublishedAlbums } from '@/server/public/queries';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/site/motion';
import { GalleryOrbit } from '@/components/site/gallery-orbit';

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const dict = getDictionary(rawLocale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['gallery.heroTitle'],
    description: dict['gallery.intro'],
    alternates: { canonical: `${appUrl}/${rawLocale}/gallery` },
    openGraph: {
      title: dict['gallery.heroTitle'],
      description: dict['gallery.intro'],
      url: `${appUrl}/${rawLocale}/gallery`,
    },
  };
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const albums = await getPublishedAlbums(locale);

  const totalPhotos = albums.reduce((sum, album) => sum + album.items.length, 0);

  if (albums.length === 0) {
    return (
      <>
        <div className="site-container pt-6">
          <Breadcrumbs
            locale={locale}
            homeLabel={dict['page.breadcrumbHome']}
            ariaLabel={dict['nav.breadcrumb']}
            items={[{ label: dict['gallery.title'] }]}
          />
        </div>
        <section className="relative overflow-hidden bg-carbon py-24 lg:py-36">
          <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="site-container relative">
            <p className="eyebrow text-brass">{dict['gallery.heroEyebrow']}</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-medium tracking-[-0.03em] text-warm-ivory sm:text-5xl">
              {dict['gallery.heroTitle']}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone/70">{dict['gallery.heroLine']}</p>
          </div>
        </section>
        <div className="site-container py-20">
          <EmptyState icon={<Images className="size-5" aria-hidden="true" />}>{dict['gallery.empty']}</EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ——— CINEMATIC OPENING —— the observatory lens ——— */}
      <section className="relative overflow-hidden bg-midnight">
        <div className="science-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-40 top-1/2 hidden size-[560px] -translate-y-1/2 rounded-full border border-cyan/15 lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-1/2 hidden size-[340px] -translate-y-1/2 rounded-full border border-solar/20 lg:block"
          aria-hidden="true"
        />
        <div className="site-container relative py-20 lg:py-32">
          <div className="lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <p className="eyebrow !text-solar">{dict['gallery.heroEyebrow']}</p>
              <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl">
                {dict['gallery.heroTitle']}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-warm-ivory/70 sm:text-lg">
                {dict['gallery.heroLine']}
              </p>
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.24em] text-cyan">{dict['gallery.album']}</dt>
                  <dd className="mt-1 font-display text-3xl font-medium tabular-nums text-solar">
                    {String(albums.length).padStart(2, '0')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.24em] text-cyan">{dict['gallery.photos']}</dt>
                  <dd className="mt-1 font-display text-3xl font-medium tabular-nums text-white">
                    {String(totalPhotos).padStart(3, '0')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Signature orbital instrument */}
            <div className="relative mt-14 lg:mt-0">
              <GalleryOrbit
                albums={albums.map((album) => ({
                  id: album.id,
                  slug: album.slug,
                  title: album.title,
                  photoCount: album.items.length,
                  coverKey: album.coverKey,
                  dateLabel: album.eventDate ? formatDate(album.eventDate, locale) : '',
                }))}
                locale={locale}
                labels={{
                  centre: dict['gallery.heroTitle'],
                  centreNote: `${String(albums.length).padStart(2, '0')} ${dict['gallery.album'].toUpperCase()}`,
                  openAlbum: dict['gallery.viewAlbum'],
                  photos: dict['gallery.photos'],
                }}
              />
            </div>
          </div>

          <div className="mt-16 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-cyan/70">
            <MoveDown className="size-3.5" aria-hidden="true" />
            {dict['gallery.orbitSection']}
          </div>
        </div>
      </section>

      {/* ——— ORBIT WALK — station directory ——— */}
      <section className="border-y border-line bg-warm-ivory/40" aria-label={dict['gallery.orbitSection']}>
        <div className="site-container py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow !text-solar">{dict['gallery.orbitSection']}</p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-muted">{dict['gallery.orbitHint']}</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-slate-muted/70 tabular-nums">
              {String(albums.length).padStart(2, '0')} · {dict['gallery.album']}
            </span>
          </div>

          <ol className="mt-10 divide-y divide-line border-y border-line">
            {albums.map((album, index) => {
              const dateLabel = album.eventDate
                ? formatDate(album.eventDate, locale)
                : '';
              return (
                <li key={album.id}>
                  <Link
                    href={`/${locale}/gallery/${album.slug}`}
                    className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 transition-colors sm:grid-cols-[3rem_11rem_1fr_auto] sm:gap-8 lg:py-8 hover:bg-white/60"
                  >
                    <span className="font-display text-sm font-semibold text-solar tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="image-reveal relative hidden aspect-[4/3] w-full overflow-hidden rounded-xl bg-midnight border border-line sm:block">
                      {album.coverKey ? (
                        <AppImage
                          storageKey={album.coverKey}
                          alt={album.title}
                          fill
                          sizes="176px"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-cyan/40">
                          <Images className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-xl font-medium tracking-[-0.02em] text-midnight transition-colors duration-300 group-hover:text-solar lg:text-2xl">
                        {album.title}
                      </span>
                      {album.description ? (
                        <span className="mt-1.5 line-clamp-2 block max-w-prose text-sm leading-relaxed text-slate-muted">
                          {album.description}
                        </span>
                      ) : null}
                      {dateLabel && !album.isFallback ? (
                        <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-muted font-medium">
                          <CalendarDays className="size-3.5 text-solar" aria-hidden="true" />
                          {dateLabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-teal-600 transition-colors group-hover:text-midnight">
                      <span>{album.items.length} {dict['gallery.photos']}</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ——— Featured exhibition plate ——— */}
      {albums[0] ? (
        <section className="bg-midnight py-20 lg:py-28 border-t border-cosmic">
          <div className="site-container">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow !text-solar">{dict['gallery.plates']}</p>
                <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                  {albums[0].title}
                </h2>
              </div>
              <Link
                href={`/${locale}/gallery/${albums[0].slug}`}
                className="btn btn-accent"
              >
                {dict['gallery.viewExhibition']}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
            <Reveal delay={0.08} className="image-reveal relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              {albums[0].coverKey ? (
                <AppImage
                  storageKey={albums[0].coverKey}
                  alt={albums[0].title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1440px"
                  className="object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center bg-cosmic">
                  <Images className="size-10 text-cyan/30" aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-midnight/90 via-midnight/30 to-transparent" aria-hidden="true" />
              <div className="absolute bottom-6 left-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan">{dict['gallery.album']}</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {albums[0].items.length} {dict['gallery.photos']}
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
