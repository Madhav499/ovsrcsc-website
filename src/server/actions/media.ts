'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { uploadMedia, updateMedia, archiveMedia } from '@/server/services/media';
import { writeAuditLog } from '@/server/services/audit';

export interface MediaFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: MediaFormState = { status: 'idle' };

function parseMediaFormData(formData: FormData) {
  const rawId = formData.get('id') as string | null;
  const rawKind = formData.get('kind') as string | null;
  const rawTitle = formData.get('title') as string | null;
  const rawAltText = formData.get('altText') as string | null;
  const rawCaption = formData.get('caption') as string | null;
  const rawIsPublic = formData.get('isPublic') as string | null;
  const rawFile = formData.get('file') as File | null;

  return {
    id: rawId || undefined,
    kind: rawKind as 'IMAGE' | 'DOCUMENT' || 'IMAGE',
    title: rawTitle?.trim() || '',
    altText: rawAltText?.trim() || '',
    caption: rawCaption?.trim() || '',
    isPublic: rawIsPublic === 'on',
    file: rawFile,
  } as const;
}

export async function uploadMediaAction(
  _previous: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseMediaFormData(formData);
  try {
    const asset = await uploadMedia(actor, {
      file: parsed.file!,
      title: parsed.title,
      altText: parsed.altText,
      caption: parsed.caption,
      isPublic: parsed.isPublic,
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'media.upload',
      entityType: 'MediaAsset',
      entityId: asset.id,
      summary: `Uploaded ${asset.kind.toLowerCase()} ${asset.originalName}`,
    });
    revalidatePath('/admin/media');
    return { status: 'success', message: 'Media uploaded successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[uploadMediaAction]', error);
    return { status: 'error', message: 'Failed to upload media. Please try again.' };
  }
}

export async function updateMediaAction(
  _previous: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseMediaFormData(formData);
  try {
    const asset = await updateMedia(actor, parsed.id!, {
      title: parsed.title,
      altText: parsed.altText,
      caption: parsed.caption,
      isPublic: parsed.isPublic,
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'media.update',
      entityType: 'MediaAsset',
      entityId: asset.id,
      summary: `Updated media ${asset.title}`,
    });
    revalidatePath('/admin/media');
    return { status: 'success', message: 'Media updated successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[updateMediaAction]', error);
    return { status: 'error', message: 'Failed to update media. Please try again.' };
  }
}

export async function archiveMediaAction(
  _previous: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const id = (formData.get('id') as string | null)?.trim();
  if (!id) {
    return { ..._previous, status: 'error', message: 'Media ID is required.' };
  }
  try {
    await archiveMedia(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'media.archive',
      entityType: 'MediaAsset',
      entityId: id,
      summary: `Archived media ${id}`,
    });
    revalidatePath('/admin/media');
    return { status: 'success', message: 'Media archived successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[archiveMediaAction]', error);
    return { status: 'error', message: 'Failed to archive media. Please try again.' };
  }
}