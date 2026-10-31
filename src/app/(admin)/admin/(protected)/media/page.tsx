import { getActor } from '@/server/auth/actor';
import { listMediaForAdmin } from '@/server/services/media';
import { hasPermission } from '@/lib/permissions';
import MediaLibrary, { type MediaLibraryItem } from '@/components/admin/media-library';

export default async function AdminMediaPage() {
  const actor = await getActor();
  if (!actor) return null;
  const assets = await listMediaForAdmin(actor, { includeArchived: false });
  const items: MediaLibraryItem[] = assets.map((asset) => ({
    id: asset.id,
    storageKey: asset.storageKey,
    title: asset.title,
    originalName: asset.originalName,
    altText: asset.altText,
    caption: asset.caption ?? '',
    isPublic: asset.isPublic,
    kind: asset.kind,
    sizeBytes: asset.sizeBytes,
    createdAt: asset.createdAt.toISOString(),
  }));
  return <MediaLibrary items={items} canManage={hasPermission(actor, 'media.manage')} />;
}
