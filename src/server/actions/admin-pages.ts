'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createPage, updatePage, archivePage } from '@/server/services/pages';
import type { AdminActionState } from '@/lib/admin-payload';
import { toActionFailure } from '@/lib/admin-payload';

interface PagePayload {
  path?: string;
  sectionId?: string;
  featured?: boolean;
  sortOrder?: number;
  coverKey?: string | null;
  publish?: boolean;
  wasPublished?: boolean;
  translations?: Array<{
    locale?: string;
    title?: string;
    summary?: string;
    bodyHtml?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
}

function revalidatePageLocales(path: string): void {
  for (const locale of ['en', 'gu', 'hi'] as const) {
    revalidatePath(`/${locale}/${path}`);
  }
}

export async function savePageAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = JSON.parse(String(formData.get('payload') ?? '{}')) as PagePayload;
    const id = String(formData.get('id') ?? '');
    const headline = String(payload.path ?? '').replace(/^\/+/, '').trim();
    if (!headline) throw Error('A page address (path) is required.');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a section for this page.');

    const translations = (payload.translations ?? [])
      .filter((translation) => (translation.title ?? '').trim().length > 0)
      .map((translation) => ({
        locale: (translation.locale ?? 'en') as 'en' | 'gu' | 'hi',
        title: translation.title ?? '',
        summary: translation.summary?.trim() ? translation.summary.trim() : null,
        bodyHtml: translation.bodyHtml ?? '',
        seoTitle: translation.seoTitle?.trim() ? translation.seoTitle.trim() : null,
        seoDescription: translation.seoDescription?.trim() ? translation.seoDescription.trim() : null,
        publish: Boolean(payload.publish),
      }));

    const shared = {
      path: headline,
      sectionId,
      featured: Boolean(payload.featured),
      sortOrder: Number(payload.sortOrder ?? 0) || 0,
      coverKey: payload.coverKey?.trim() ? payload.coverKey.trim() : null,
      translations,
      intent:
        payload.publish === true
          ? ('publish' as const)
          : payload.publish === false && payload.wasPublished === true
            ? ('unpublish' as const)
            : ('save' as const),
    } as const;

    let pagePath: string;
    const isUpdate = Boolean(id);
    if (isUpdate) {
      const page = await updatePage(actor, id, shared, String(formData.get('expectedUpdatedAt') ?? '') || undefined);
      pagePath = page.path;
      await writeAuditLog({
        actorId: actor.id,
        action: 'page.update',
        entityType: 'Page',
        entityId: page.id,
        summary: `Updated page /${pagePath}`,
        metadata: { status: page.status },
      });
    } else {
      const page = await createPage(actor, shared);
      pagePath = page.path;
      await writeAuditLog({
        actorId: actor.id,
        action: 'page.create',
        entityType: 'Page',
        entityId: page.id,
        summary: `Created page /${pagePath}`,
        metadata: { status: page.status },
      });
    }

    revalidatePath('/admin/pages');
    revalidatePageLocales(pagePath);
    return { status: 'success', message: isUpdate ? 'Page updated.' : 'Page created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save page. Please try again.');
  }
}

export async function archivePageAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archivePage(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'page.archive',
      entityType: 'Page',
      entityId: id,
      summary: `Archived page ${id}`,
    });
    revalidatePath('/admin/pages');
    return { status: 'success', message: 'Page archived.' };
  } catch (error) {
    return toActionFailure(error, 'Failed to archive page.');
  }
}
