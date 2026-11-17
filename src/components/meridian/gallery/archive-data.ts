import 'server-only';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { repairText } from '@/lib/meridian/text';
import { db } from '@/lib/db';
import { localeToPrismaLocale } from '@/i18n';
import { getPublishedAlbums } from '@/server/public/queries';
import type { ArchiveAlbum, ArchivePhoto } from './film-model';

/**
 * Builds the archive from published CMS albums (read-only). The sequence is
 * the albums' own order, then each album's photo order as set in the admin;
 * a photograph used in several albums appears once in "All". Only
 * published, public, non-archived media reach the public site (enforced by
 * getPublishedAlbums), so unpublishing or removing a photo removes its frame.
 */
export async function getArchive(locale: LocaleCode) {
  const albums = await getPublishedAlbums(locale);
  const captions = await translatedCaptions(albums.map((album) => album.id), locale);
  const byMedia = new Map<string, ArchivePhoto>();
  const categories: ArchiveAlbum[] = [];

  for (const album of albums) {
    const title = repairText(album.title);
    categories.push({ slug: album.slug, title, count: album.items.length });
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
        alt: repairText(captions.get(`${album.id}:${item.mediaId}`)?.alt ?? item.altText) || title,
        caption: repairText(captions.get(`${album.id}:${item.mediaId}`)?.caption ?? item.caption),
        albums: [album.slug],
        albumTitle: title,
        date: album.eventDate ? album.eventDate.toISOString() : null,
      });
    }
  }

  return {
    photos: Array.from(byMedia.values()),
    albums: categories,
    slugs: albums.map((album) => album.slug),
  };
}

/**
 * Machine-translated photo captions/alt text (stored on the album's
 * translation state). English, or anything not yet translated, falls back to
 * the CMS text. Stale translations stay in use until regenerated.
 */
async function translatedCaptions(albumIds: string[], locale: LocaleCode) {
  const map = new Map<string, { caption: string | null; alt: string | null }>();
  if (locale === 'en' || albumIds.length === 0) return map;
  const states = await db.translationState.findMany({
    where: { entityType: 'GalleryAlbum', entityId: { in: albumIds }, locale: localeToPrismaLocale(locale), status: { in: ['DONE', 'STALE', 'FAILED'] } },
    select: { entityId: true, fields: true },
  });
  for (const state of states) {
    const items = (state.fields as { items?: Record<string, { caption: string | null; alt: string | null }> } | null)?.items ?? {};
    for (const [mediaId, value] of Object.entries(items)) {
      map.set(`${state.entityId}:${mediaId}`, { caption: value.caption || null, alt: value.alt || null });
    }
  }
  return map;
}

export type FilmLabels = ReturnType<typeof filmLabels>;

export function filmLabels(dict: Dictionary) {
  const keys = [
    'archive', 'strip', 'index', 'views', 'edge', 'back', 'prev', 'next', 'frame', 'album', 'date', 'caption',
    'collection', 'collectionName', 'size', 'open', 'of', 'hint', 'empty', 'emptyNote', 'albums', 'all', 'close',
    'original', 'viewer', 'unavailable', 'frames',
  ] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, dict[`mx.film.${key}` as keyof Dictionary]])) as Record<(typeof keys)[number], string>;
  return { ...labels, newTab: dict['a11y.newTab'], title: dict['gallery.title'], intro: dict['gallery.intro'] };
}
