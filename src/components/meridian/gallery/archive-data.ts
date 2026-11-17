import 'server-only';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { repairText } from '@/lib/meridian/text';
import { getPublishedAlbums } from '@/server/public/queries';
import type { ArchiveAlbum, ArchivePhoto } from './archive-model';
import type { ArchiveLabels } from './gallery-archive';

/**
 * Builds the archive from the existing CMS albums (read-only). Albums are
 * the browsing categories; "All" is every published photograph, de-duplicated
 * by media id when a photo sits in more than one album. An album without
 * photographs is still a category (it shows an empty state, count 00).
 */
export async function getArchive(locale: LocaleCode) {
  const albums = await getPublishedAlbums(locale);
  const byMedia = new Map<string, ArchivePhoto>();
  const categories: ArchiveAlbum[] = [];

  for (const album of albums) {
    categories.push({ slug: album.slug, title: repairText(album.title), count: album.items.length });
    for (const item of album.items) {
      const existing = byMedia.get(item.mediaId);
      if (existing) {
        existing.albums.push(album.slug);
        continue;
      }
      byMedia.set(item.mediaId, {
        id: item.mediaId,
        storageKey: item.storageKey,
        width: item.width,
        height: item.height,
        alt: repairText(item.altText) || repairText(album.title),
        caption: repairText(item.caption),
        albums: [album.slug],
      });
    }
  }

  return {
    photos: Array.from(byMedia.values()),
    albums: categories,
    /** Every published album slug, including empty ones (route validity). */
    slugs: albums.map((album) => album.slug),
  };
}

export function archiveLabels(dict: Dictionary): ArchiveLabels {
  return {
    all: dict['mx.gal.all'],
    choose: dict['mx.gal.choose'],
    open: dict['a11y.openImage'],
    loadMore: dict['mx.gal.loadMore'],
    tools: dict['mx.gal.tools'],
    grid: dict['mx.gal.grid'],
    feature: dict['mx.gal.feature'],
    albums: dict['mx.gal.albums'],
    top: dict['mx.gal.top'],
    unavailable: dict['mx.gal.unavailable'],
    empty: dict['mx.gal.empty'],
    emptyNote: dict['mx.gal.emptyNote'],
    emptyAlbum: dict['mx.gal.emptyAlbum'],
    viewer: dict['gallery.exhibition'],
    close: dict['mx.gal.close'],
    previous: dict['mx.gal.prevHint'],
    next: dict['mx.gal.nextHint'],
    original: dict['mx.gal.original'],
    newTab: dict['a11y.newTab'],
  };
}
