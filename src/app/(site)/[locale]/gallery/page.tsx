import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { localeAlternates } from '@/lib/meridian/site';
import { archiveLabels, getArchive } from '@/components/meridian/gallery/archive-data';
import { GalleryArchive } from '@/components/meridian/gallery/gallery-archive';
import { ScienceFigure } from '@/components/meridian/journal/figures';

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

/** The photography archive — every published photograph ("All"). */
export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const archive = await getArchive(locale);

  return (
    <GalleryArchive
      title={dict['gallery.title']}
      intro={dict['gallery.intro']}
      photos={archive.photos}
      albums={archive.albums}
      initialAlbum={null}
      basePath={`/${locale}/gallery`}
      labels={archiveLabels(dict)}
      emptyFigure={<ScienceFigure name="lens" dict={dict} number={1} />}
    />
  );
}
