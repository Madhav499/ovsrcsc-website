'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createNotice, updateNotice, archiveNotice } from '@/server/services/notices';
import { writeAuditLog } from '@/server/services/audit';

export interface NoticeFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: NoticeFormState = { status: 'idle' };

function parseNoticeFormData(formData: FormData) {
  const rawSlug = formData.get('slug') as string | null;
  const rawSectionId = formData.get('sectionId') as string | null;
  const rawIsPinned = formData.get('isPinned') as string | null;
  const rawPublishAt = formData.get('publishAt') as string | null;
  const rawExpireAt = formData.get('expireAt') as string | null;

  const rawAttachmentIds = formData.getAll('attachmentId') as string[];
  const attachmentIds = rawAttachmentIds.filter((id) => id.trim());

  const translationsRaw = formData.getAll('translation') as string[];
  const translations = [];
  for (let i = 0; i < translationsRaw.length; i += 5) {
    const locale = translationsRaw[i] || 'en';
    const title = translationsRaw[i + 1] || '';
    const bodyHtml = translationsRaw[i + 2] || '';
    const linkUrl = translationsRaw[i + 3] || undefined;
    const linkLabel = translationsRaw[i + 4] || undefined;
    translations.push({ locale, title, bodyHtml, linkUrl, linkLabel });
  }

  const rawIntent = formData.get('intent') as string | null;
  const intent: 'save' | 'publish' | 'unpublish' =
    rawIntent != null && ['save', 'publish', 'unpublish'].includes(rawIntent as 'save' | 'publish' | 'unpublish')
      ? (rawIntent as 'save' | 'publish' | 'unpublish')
      : 'save';

  return {
    slug: (rawSlug || '').trim(),
    sectionId: (rawSectionId || '').trim(),
    isPinned: rawIsPinned === 'on',
    publishAt: rawPublishAt ? new Date(rawPublishAt) : undefined,
    expireAt: rawExpireAt ? new Date(rawExpireAt) : undefined,
    attachmentIds,
    translations,
    intent,
  } as const;
}

export async function createNoticeAction(
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseNoticeFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  if (!parsed.sectionId) {
    return { ..._previous, status: 'error', message: 'Section ID is required.' };
  }
  try {
    const notice = await createNotice(actor, {
      slug: parsed.slug,
      sectionId: parsed.sectionId,
      isPinned: parsed.isPinned,
      publishAt: parsed.publishAt,
      expireAt: parsed.expireAt,
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        bodyHtml: t.bodyHtml,
        linkUrl: t.linkUrl ?? null,
        linkLabel: t.linkLabel ?? null,
      })),
      intent: parsed.intent,
      attachmentIds: parsed.attachmentIds,
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'notice.create',
      entityType: 'Notice',
      entityId: notice.id,
      summary: `Created notice ${notice.slug}`,
    });
    revalidatePath('/admin/notices');
    return { status: 'success', message: 'Notice created successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[createNoticeAction]', error);
    return { status: 'error', message: 'Failed to create notice. Please try again.' };
  }
}

export async function updateNoticeAction(
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseNoticeFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  try {
    const notice = await updateNotice(actor, parsed.slug, {
      sectionId: parsed.sectionId,
      isPinned: parsed.isPinned,
      publishAt: parsed.publishAt,
      expireAt: parsed.expireAt,
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        bodyHtml: t.bodyHtml,
        linkUrl: t.linkUrl ?? null,
        linkLabel: t.linkLabel ?? null,
      })),
      intent: parsed.intent,
      attachmentIds: parsed.attachmentIds,
    }, formData.get('expectedUpdatedAt') as string | undefined);
    await writeAuditLog({
      actorId: actor.id,
      action: parsed.intent === 'publish' ? 'notice.publish' : 'notice.update',
      entityType: 'Notice',
      entityId: notice.id,
      summary: `Updated notice ${notice.slug}`,
      metadata: { status: notice.status },
    });
    revalidatePath('/admin/notices');
    return { status: 'success', message: 'Notice updated successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[updateNoticeAction]', error);
    return { status: 'error', message: 'Failed to update notice. Please try again.' };
  }
}

export async function archiveNoticeAction(
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const slug = (formData.get('slug') as string | null)?.trim();
  if (!slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  try {
    await archiveNotice(actor, slug);
    await writeAuditLog({
      actorId: actor.id,
      action: 'notice.archive',
      entityType: 'Notice',
      entityId: slug,
      summary: `Archived notice ${slug}`,
    });
    revalidatePath('/admin/notices');
    return { status: 'success', message: 'Notice archived successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[archiveNoticeAction]', error);
    return { status: 'error', message: 'Failed to archive notice. Please try again.' };
  }
}