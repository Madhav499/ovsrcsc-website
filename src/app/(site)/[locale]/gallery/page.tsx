import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { localeAlternates } from '@/lib/meridian/site';
import { filmLabels, getArchive } from '@/components/meridian/gallery/archive-data';
import { FilmArchive } from '@/components/meridian/gallery/film-archive';

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; photo?: string }>;
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

/** The photo archive — every published photograph, as a roll (default) or an index (?view=index). */
export default async function GalleryPage({ params, searchParams }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const archive = await getArchive(locale);

  const query = await searchParams;

  return (
    <FilmArchive
      photos={archive.photos}
      albums={archive.albums}
      initialAlbum={null}
      initialView={query.view === 'index' ? 'index' : 'strip'}
      initialPhoto={typeof query.photo === 'string' ? query.photo : null}
      basePath={`/${locale}/gallery`}
      labels={filmLabels(dict)}
      locale={locale}
    />
  );
}
