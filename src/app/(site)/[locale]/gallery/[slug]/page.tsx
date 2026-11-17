import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { siteOrigin } from '@/lib/meridian/site';
import { getAlbumBySlug } from '@/server/public/queries';
import { archiveLabels, getArchive } from '@/components/meridian/gallery/archive-data';
import { GalleryArchive } from '@/components/meridian/gallery/gallery-archive';

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

/**
 * An album is a category of the archive: the same experience as /gallery,
 * with this album pre-selected. The URL, metadata and 404 behaviour are
 * unchanged; switching albums on the page updates the address in place.
 */
export default async function AlbumPage({ params }: AlbumPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const archive = await getArchive(locale);
  if (!archive.slugs.includes(slug)) notFound();

  return (
    <GalleryArchive
      title={dict['gallery.title']}
      intro={dict['gallery.intro']}
      photos={archive.photos}
      albums={archive.albums}
      initialAlbum={slug}
      basePath={`/${locale}/gallery`}
      labels={archiveLabels(dict)}
    />
  );
}
