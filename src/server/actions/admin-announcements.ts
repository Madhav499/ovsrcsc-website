'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createAnnouncement, updateAnnouncement, archiveAnnouncement } from '@/server/services/announcements';
import { parseInstitutionLocal } from '@/lib/dates';
import type { AdminActionState } from '@/lib/admin-payload';
import { readPayload, toActionFailure } from '@/lib/admin-payload';

interface AnnouncementPayload {
  sectionId?: string;
  enabled?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  linkUrl?: string | null;
  imageKey?: string | null;
  publish?: boolean;
  wasPublished?: boolean;
  translations?: Array<{ locale?: string; title?: string; message?: string; linkLabel?: string }>;
}

export async function saveAnnouncementAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = readPayload<AnnouncementPayload>(formData);
    const id = String(formData.get('id') ?? '');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a section for this announcement.');

    const translations = (payload.translations ?? [])
      .filter((translation) => (translation.title ?? '').trim().length > 0)
      .map((translation) => ({
        locale: (translation.locale ?? 'en') as 'en' | 'gu' | 'hi',
        title: translation.title ?? '',
        message: translation.message ?? '',
        linkLabel: translation.linkLabel?.trim() ? translation.linkLabel.trim() : null,
      }));

    const shared = {
      sectionId,
      enabled: Boolean(payload.enabled),
      status: (payload.publish ? 'PUBLISHED' : 'DRAFT') as 'DRAFT' | 'PUBLISHED',
      startAt: payload.startAt ? parseInstitutionLocal(payload.startAt) : null,
      endAt: payload.endAt ? parseInstitutionLocal(payload.endAt) : null,
      linkUrl: payload.linkUrl?.trim() ? payload.linkUrl.trim() : null,
      imageKey: payload.imageKey?.trim() ? payload.imageKey.trim() : null,
      translations,
      intent: payload.publish === true ? ('publish' as const) : ('save' as const),
    };

    const announcement = id
      ? await updateAnnouncement(actor, id, shared)
      : await createAnnouncement(actor, shared);

    await writeAuditLog({
      actorId: actor.id,
      action: id ? 'announcement.update' : 'announcement.create',
      entityType: 'Announcement',
      entityId: announcement.id,
      summary: `${id ? 'Updated' : 'Created'} announcement (status ${announcement.status})`,
    });

    revalidatePath('/admin/announcements');
    for (const locale of ['en', 'gu', 'hi'] as const) {
      revalidatePath(`/${locale}`);
    }
    return { status: 'success', message: id ? 'Announcement updated.' : 'Announcement created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save the announcement.');
  }
}

export async function archiveAnnouncementAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archiveAnnouncement(actor, id);
    revalidatePath('/admin/announcements');
    return { status: 'success', message: 'Announcement archived.' };
  } catch (error) {
    return toActionFailure(error, 'Failed to archive the announcement.');
  }
}
