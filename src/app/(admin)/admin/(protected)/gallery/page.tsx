import { getActor } from '@/server/auth/actor';
import { listAlbumsForAdmin } from '@/server/services/gallery';
import { listSections } from '@/server/services/users';
import { listMediaForAdmin } from '@/server/services/media';
import AlbumManager, { type AlbumShell } from '@/components/admin/album-manager';

export default async function AdminGalleryPage() {
  const actor = await getActor();
  if (!actor) return null;

  const [albums, sections, mediaAssets] = await Promise.all([
    listAlbumsForAdmin(actor),
    listSections(),
    listMediaForAdmin(actor, { includeArchived: false }),
  ]);

  const albumShells: AlbumShell[] = albums.map((album) => {
    const translations: AlbumShell['translations'] = {};
    for (const translation of album.translations) {
      translations[translation.locale.toLowerCase() as 'en' | 'gu' | 'hi'] = {
        title: translation.title,
        description: translation.description ?? '',
      };
    }
    const english = album.translations.find((item) => item.locale === 'EN');
    return {
      id: album.id,
      slug: album.slug,
      status: album.status,
      sectionId: album.sectionId,
      eventDate: album.eventDate ? album.eventDate.toISOString() : '',
      coverKey: album.coverKey ?? '',
      sortOrder: album.sortOrder,
      expectedUpdatedAt: album.updatedAt.toISOString(),
      searchIndex: english?.title ?? album.slug,
      translations,
      items: album.items.map((item) => ({
        mediaId: item.mediaId,
        caption: item.caption ?? '',
        altText: item.altText ?? '',
        storageKey: item.media?.storageKey ?? '',
      })),
    };
  });

  const sectionOptions = sections.map((section) => ({ value: section.id, label: section.nameEn }));
  const media = mediaAssets.map((asset) => ({
    id: asset.id,
    storageKey: asset.storageKey,
    title: asset.title,
  }));

  return <AlbumManager albums={albumShells} sections={sectionOptions} media={media} />;
}
