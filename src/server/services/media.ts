import 'server-only';
import type { MediaKind } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES } from '@/lib/constants';
import { hasPermission } from '@/lib/permissions';
import { assertPermission, type Actor } from '@/server/auth/actor';
import { removeStoredFile, storeDocument, storeImage } from '@/server/media/storage';
import { writeAuditLog } from './audit';

export interface MediaUploadInput {
  file: File;
  title?: string;
  altText?: string;
  caption?: string;
  isPublic?: boolean;
}

export async function uploadMedia(actor: Actor, input: MediaUploadInput) {
  assertPermission(actor, 'media.upload');
  if (!input.file || input.file.size === 0) {
    throw new ValidationError('Please choose a file to upload.');
  }
  const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(input.file.type);
  const isDocument = (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(input.file.type);
  if (!isImage && !isDocument) {
    throw new ValidationError('This file type is not allowed.');
  }

  const stored = isImage ? await storeImage(input.file) : await storeDocument(input.file);
  try {
    const asset = await db.mediaAsset.create({
      data: {
        storageKey: stored.key,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        kind: isImage ? 'IMAGE' : 'DOCUMENT',
        title: input.title?.trim() || stored.originalName.replace(/\.[^.]+$/, ''),
        altText: input.altText?.trim() || '',
        caption: input.caption?.trim() || null,
        isPublic: input.isPublic ?? true,
        createdById: actor.id,
      },
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'media.upload',
      entityType: 'MediaAsset',
      entityId: asset.id,
      summary: `Uploaded ${isImage ? 'image' : 'document'} ${asset.originalName}`,
    });
    return asset;
  } catch (error) {
    await removeStoredFile(stored.key);
    throw error;
  }
}

export async function listMediaForAdmin(
  actor: Actor,
  options: { kind?: MediaKind | 'ALL'; q?: string; includeArchived?: boolean } = {},
) {
  assertPermission(actor, 'media.view');
  return db.mediaAsset.findMany({
    where: {
      ...(options.kind && options.kind !== 'ALL' ? { kind: options.kind } : {}),
      ...(options.includeArchived ? {} : { archivedAt: null }),
      ...(options.q
        ? {
            OR: [
              { title: { contains: options.q, mode: 'insensitive' } },
              { originalName: { contains: options.q, mode: 'insensitive' } },
              { altText: { contains: options.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getMediaForAdmin(actor: Actor, mediaId: string) {
  assertPermission(actor, 'media.view');
  const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) throw new NotFoundError('Media item not found.');
  return asset;
}

export async function updateMedia(
  actor: Actor,
  mediaId: string,
  input: { title: string; altText: string; caption?: string; isPublic: boolean },
) {
  assertPermission(actor, 'media.view');
  const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) throw new NotFoundError('Media item not found.');
  const canManage = hasPermission(actor, 'media.manage');
  if (!canManage && asset.createdById !== actor.id) {
    throw new ForbiddenError('You can only edit media that you uploaded.');
  }
  if (input.title.trim().length < 2) {
    throw new ValidationError('Please provide a descriptive title.', {
      title: 'Title is required.',
    });
  }
  if (asset.kind === 'IMAGE' && !input.altText.trim()) {
    throw new ValidationError('Please provide alternative text for the image.', {
      altText: 'Alternative text is required for images.',
    });
  }
  const updated = await db.mediaAsset.update({
    where: { id: mediaId },
    data: {
      title: input.title.trim().slice(0, 200),
      altText: input.altText.trim().slice(0, 400),
      caption: input.caption?.trim().slice(0, 500) || null,
      isPublic: input.isPublic,
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'media.update',
    entityType: 'MediaAsset',
    entityId: mediaId,
    summary: `Updated media ${updated.title}`,
  });
  return updated;
}

export async function archiveMedia(actor: Actor, mediaId: string) {
  assertPermission(actor, 'media.manage');
  const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) throw new NotFoundError('Media item not found.');
  if (asset.archivedAt) return asset;

  const references = await countMediaReferences(asset.storageKey);
  if (references > 0) {
    throw new ConflictError(
      'This media item is still used on the website. Remove it from those pages, albums or notices before archiving it.',
    );
  }

  const updated = await db.mediaAsset.update({
    where: { id: mediaId },
    data: { archivedAt: new Date(), isPublic: false },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'media.archive',
    entityType: 'MediaAsset',
    entityId: mediaId,
    summary: `Archived media ${asset.title}`,
  });
  return updated;
}

async function countMediaReferences(storageKey: string): Promise<number> {
  const [pages, posts, events, announcements, albums, items, attachments] = await Promise.all([
    db.page.count({ where: { coverKey: storageKey } }),
    db.blogPost.count({ where: { coverKey: storageKey } }),
    db.event.count({ where: { coverKey: storageKey } }),
    db.announcement.count({ where: { imageKey: storageKey } }),
    db.galleryAlbum.count({ where: { coverKey: storageKey } }),
    db.galleryItem.count({ where: { media: { storageKey } } }),
    db.noticeAttachment.count({ where: { media: { storageKey } } }),
  ]);
  return pages + posts + events + announcements + albums + items + attachments;
}

export async function replaceMediaFile(
  actor: Actor,
  mediaId: string,
  file: File,
): Promise<{ id: string; storageKey: string }> {
  assertPermission(actor, 'media.manage');
  const asset = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) throw new NotFoundError('Media item not found.');
  const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
  const isDocument = (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type);
  if (!isImage && !isDocument) throw new ValidationError('This file type is not allowed.');
  if (isImage !== (asset.kind === 'IMAGE')) {
    throw new ValidationError('The replacement file must be the same kind as the original.');
  }
  const stored = isImage ? await storeImage(file) : await storeDocument(file);
  const references = await countMediaReferences(asset.storageKey);
  if (references > 0) {
    throw new ConflictError(
      'This media item is in use. Upload a new file instead so existing content is not changed unexpectedly.',
    );
  }
  try {
    await db.mediaAsset.update({
      where: { id: mediaId },
      data: {
        storageKey: stored.key,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
      },
    });
    await removeStoredFile(asset.storageKey);
    await writeAuditLog({
      actorId: actor.id,
      action: 'media.replace',
      entityType: 'MediaAsset',
      entityId: mediaId,
      summary: `Replaced media file for ${asset.title}`,
    });
    return { id: mediaId, storageKey: stored.key };
  } catch (error) {
    await removeStoredFile(stored.key);
    throw error;
  }
}
