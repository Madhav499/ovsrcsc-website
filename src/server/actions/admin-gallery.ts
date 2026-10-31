'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createAlbum, updateAlbum, archiveAlbum, deleteGalleryItem, type GalleryAlbumInput } from '@/server/services/gallery';
import { parseInstitutionLocal } from '@/lib/dates';
import type { AdminActionState } from '@/lib/admin-payload';
import { readPayload, toActionFailure } from '@/lib/admin-payload';

interface AlbumPayload {
  slug?: string;
  sectionId?: string;
  eventDate?: string | null;
  coverKey?: string | null;
  sortOrder?: number;
  publish?: boolean;
  wasPublished?: boolean;
  itemIds?: string[];
  captions?: Array<{ mediaId: string; caption?: string; altText?: string }>;
  translations?: Array<{ locale?: string; title?: string; description?: string }>;
}

function revalidateGallerySite(slug: string): void {
  for (const locale of ['en', 'gu', 'hi'] as const) {
    revalidatePath(`/${locale}/gallery`);
    if (slug) revalidatePath(`/${locale}/gallery/${slug}`);
  }
}

export async function saveAlbumAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = readPayload<AlbumPayload>(formData);
    const id = String(formData.get('id') ?? '');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a program section for this album.');

    const translations = (payload.translations ?? []).map((translation) => ({
      locale: translation.locale ?? 'en',
      title: translation.title ?? '',
      description: translation.description ?? '',
    }));

    const input: GalleryAlbumInput = {
      slug: payload.slug?.trim() || undefined,
      sectionId,
      eventDate: payload.eventDate ? parseInstitutionLocal(payload.eventDate) : null,
      coverKey: payload.coverKey?.trim() ? payload.coverKey.trim() : null,
      sortOrder: Number(payload.sortOrder ?? 0) || 0,
      itemIds: payload.itemIds ?? [],
      captions: payload.captions ?? [],
      translations,
      intent:
        payload.publish === true
          ? 'publish'
          : payload.publish === false && payload.wasPublished === true
            ? 'unpublish'
            : 'save',
    };

    const album = id
      ? await updateAlbum(actor, id, input, String(formData.get('expectedUpdatedAt') ?? '') || undefined)
      : await createAlbum(actor, input);

    if (album.id) {
      await writeAuditLog({
        actorId: actor.id,
        action: id ? 'album.update' : 'album.create',
        entityType: 'GalleryAlbum',
        entityId: album.id,
        summary: `${id ? 'Updated' : 'Created'} album ${album.slug} (${album.status})`,
      });
    }

    revalidatePath('/admin/gallery');
    revalidateGallerySite(album.slug);
    return { status: 'success', message: id ? 'Album updated.' : 'Album created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save the album. Please try again.');
  }
}

export async function archiveAlbumAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    const slug = String(formData.get('slug') ?? '');
    if (!id) throw Error('Album reference missing.');
    await archiveAlbum(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'album.archive',
      entityType: 'GalleryAlbum',
      entityId: id,
      summary: `Archived album ${slug || id}`,
    });
    revalidatePath('/admin/gallery');
    if (slug) revalidateGallerySite(slug);
    return { status: 'success', message: 'Album archived.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to archive the album.');
  }
}

export async function removeGalleryItemAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const itemId = String(formData.get('itemId') ?? '');
    const slug = String(formData.get('slug') ?? '');
    if (!itemId) throw Error('Item reference missing.');
    await deleteGalleryItem(actor, itemId);
    await writeAuditLog({
      actorId: actor.id,
      action: 'galleryItem.remove',
      entityType: 'GalleryItem',
      entityId: itemId,
      summary: `Removed gallery item ${itemId}`,
    });
    revalidatePath('/admin/gallery');
    if (slug) revalidateGallerySite(slug);
    return { status: 'success', message: 'Image removed from the album.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to remove the image.');
  }
}
