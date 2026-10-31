'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createResourceLink, updateResourceLink, archiveResourceLink, type ResourceInput } from '@/server/services/resources';
import type { AdminActionState } from '@/lib/admin-payload';
import { readPayload, toActionFailure } from '@/lib/admin-payload';

export async function saveResourceAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = readPayload<{
      id?: string;
      sectionId?: string;
      title?: string;
      description?: string;
      url?: string;
      category?: string;
      isExternal?: boolean;
      isPublished?: boolean;
      sortOrder?: number;
    }>(formData);

    const input: ResourceInput = {
      sectionId: payload.sectionId ?? '',
      title: payload.title ?? '',
      description: payload.description ?? '',
      url: payload.url ?? '',
      category: payload.category ?? '',
      isExternal: Boolean(payload.isExternal),
      isPublished: Boolean(payload.isPublished),
      sortOrder: Number(payload.sortOrder ?? 0) || 0,
    };

    if (payload.id) {
      await updateResourceLink(actor, payload.id, input);
    } else {
      await createResourceLink(actor, input);
    }

    revalidatePath('/admin/resources');
    for (const locale of ['en', 'gu', 'hi'] as const) {
      revalidatePath(`/${locale}/downloads`);
    }
    return { status: 'success', message: payload.id ? 'Resource updated.' : 'Resource added.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save the resource.');
  }
}

export async function archiveResourceAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archiveResourceLink(actor, id);
    revalidatePath('/admin/resources');
    return { status: 'success', message: 'Resource removed.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to remove the resource.');
  }
}
