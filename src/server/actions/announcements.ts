'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createAnnouncement, updateAnnouncement, archiveAnnouncement } from '@/server/services/announcements';
import { writeAuditLog } from '@/server/services/audit';

export interface AnnouncementFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: AnnouncementFormState = { status: 'idle' };

function parseAnnouncementFormData(formData: FormData) {
  const rawId = formData.get('id') as string | null;
  const rawSectionId = formData.get('sectionId') as string | null;
  const rawEnabled = formData.get('enabled') as string | null;
  const rawStatus = formData.get('status') as string | null;
  const rawStartAt = formData.get('startAt') as string | null;
  const rawEndAt = formData.get('endAt') as string | null;
  const rawLinkUrl = formData.get('linkUrl') as string | null;
  const rawImageKey = formData.get('imageKey') as string | null;

  const translationsRaw = formData.getAll('translation') as string[];
  const translations = [];
  for (let i = 0; i < translationsRaw.length; i += 5) {
    const locale = translationsRaw[i] || 'en';
    const title = translationsRaw[i + 1] || '';
    const message = translationsRaw[i + 2] || '';
    const linkUrl = translationsRaw[i + 3] || undefined;
    const linkLabel = translationsRaw[i + 4] || undefined;
    translations.push({ locale, title, message, linkUrl, linkLabel });
  }

  const rawIntent = formData.get('intent') as string | null;
  const intent: 'save' | 'publish' | 'unarchive' =
    rawIntent != null && ['save', 'publish', 'unarchive'].includes(rawIntent as 'save' | 'publish' | 'unarchive')
      ? (rawIntent as 'save' | 'publish' | 'unarchive')
      : 'save';

  return {
    id: rawId || undefined,
    sectionId: (rawSectionId || '').trim(),
    enabled: rawEnabled === 'on',
    status: rawStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    startAt: rawStartAt ? new Date(rawStartAt) : new Date(),
    endAt: rawEndAt ? new Date(rawEndAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    linkUrl: rawLinkUrl || undefined,
    imageKey: rawImageKey || undefined,
    translations,
    intent,
  } as const;
}

export async function createAnnouncementAction(
  _previous: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseAnnouncementFormData(formData);
  try {
    const announcement = await createAnnouncement(actor, parsed);
    await writeAuditLog({
      actorId: actor.id,
      action: 'announcement.create',
      entityType: 'Announcement',
      entityId: announcement.id,
      summary: `Created announcement ${announcement.id}`,
    });
    revalidatePath('/admin/announcements');
    return { status: 'success', message: 'Announcement created successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[createAnnouncementAction]', error);
    return { status: 'error', message: 'Failed to create announcement. Please try again.' };
  }
}

export async function updateAnnouncementAction(
  _previous: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseAnnouncementFormData(formData);
  try {
    const announcement = await updateAnnouncement(actor, parsed.id!, parsed);
    await writeAuditLog({
      actorId: actor.id,
      action: parsed.intent === 'publish' ? 'announcement.publish' : 'announcement.update',
      entityType: 'Announcement',
      entityId: announcement.id,
      summary: `Updated announcement ${announcement.id}`,
    });
    revalidatePath('/admin/announcements');
    return { status: 'success', message: 'Announcement updated successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[updateAnnouncementAction]', error);
    return { status: 'error', message: 'Failed to update announcement. Please try again.' };
  }
}

export async function archiveAnnouncementAction(
  _previous: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const id = (formData.get('id') as string | null)?.trim();
  if (!id) {
    return { ..._previous, status: 'error', message: 'Announcement ID is required.' };
  }
  try {
    await archiveAnnouncement(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'announcement.archive',
      entityType: 'Announcement',
      entityId: id,
      summary: `Archived announcement ${id}`,
    });
    revalidatePath('/admin/announcements');
    return { status: 'success', message: 'Announcement archived successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[archiveAnnouncementAction]', error);
    return { status: 'error', message: 'Failed to archive announcement. Please try again.' };
  }
}