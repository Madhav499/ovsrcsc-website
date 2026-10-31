'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createNotice, updateNotice, archiveNotice } from '@/server/services/notices';
import { parseInstitutionLocal } from '@/lib/dates';
import type { AdminActionState } from '@/lib/admin-payload';
import { toActionFailure } from '@/lib/admin-payload';

interface NoticePayload {
  slug?: string;
  sectionId?: string;
  isPinned?: boolean;
  publishAt?: string | null;
  expireAt?: string | null;
  publish?: boolean;
  wasPublished?: boolean;
  attachmentIds?: string[];
  translations?: Array<{ locale?: string; title?: string; bodyHtml?: string; linkUrl?: string; linkLabel?: string }>;
}

export async function saveNoticeAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = JSON.parse(String(formData.get('payload') ?? '{}')) as NoticePayload;
    const id = String(formData.get('id') ?? '');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a section for this notice.');

    const translations = (payload.translations ?? []).map((translation) => ({
      locale: (translation.locale ?? 'en') as 'en' | 'gu' | 'hi',
      title: translation.title ?? '',
      bodyHtml: translation.bodyHtml ?? '',
      linkUrl: translation.linkUrl?.trim() ? translation.linkUrl.trim() : null,
      linkLabel: translation.linkLabel?.trim() ? translation.linkLabel.trim() : null,
    }));

    const shared = {
      sectionId,
      isPinned: Boolean(payload.isPinned),
      publishAt: payload.publishAt ? parseInstitutionLocal(payload.publishAt) : null,
      expireAt: payload.expireAt ? parseInstitutionLocal(payload.expireAt) : null,
      attachmentIds: payload.attachmentIds ?? [],
      translations,
      intent:
        payload.publish === true
          ? ('publish' as const)
          : payload.publish === false && payload.wasPublished === true
            ? ('unpublish' as const)
            : ('save' as const),
    } as const;

    if (id) {
      const notice = await updateNotice(actor, id, { ...shared, slug: payload.slug?.trim() || undefined });
      await writeAuditLog({
        actorId: actor.id,
        action: 'notice.update',
        entityType: 'Notice',
        entityId: notice.id,
        summary: `Updated notice ${notice.slug}`,
        metadata: { status: notice.status },
      });
    } else {
      const notice = await createNotice(actor, { ...shared, slug: payload.slug?.trim() || undefined });
      await writeAuditLog({
        actorId: actor.id,
        action: 'notice.create',
        entityType: 'Notice',
        entityId: notice.id,
        summary: `Created notice ${notice.slug} (${notice.status})`,
      });
    }

    revalidatePath('/admin/notices');
    revalidatePath('/en/notices');
    revalidatePath('/gu/notices');
    revalidatePath('/hi/notices');
    return { status: 'success', message: id ? 'Notice updated.' : 'Notice created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save notice. Please try again.');
  }
}

export async function archiveNoticeAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archiveNotice(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'notice.archive',
      entityType: 'Notice',
      entityId: id,
      summary: `Archived notice ${id}`,
    });
    revalidatePath('/admin/notices');
    return { status: 'success', message: 'Notice archived.' };
  } catch (error) {
    return toActionFailure(error, 'Failed to archive notice.');
  }
}
