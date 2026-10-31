'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createPage, updatePage } from '@/server/services/pages';
import { writeAuditLog } from '@/server/services/audit';

export interface PageFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: PageFormState = { status: 'idle' };

function parsePageFormData(formData: FormData) {
  const rawSlug = formData.get('slug') as string | null;
  const rawSectionId = formData.get('sectionId') as string | null;
  const rawFeatured = formData.get('featured') as string | null;
  const rawSortOrder = formData.get('sortOrder') as string | null;
  const rawCoverKey = formData.get('coverKey') as string | null;
  const translationsRaw = formData.getAll('translation') as string[];
  const translations = [];
  for (let i = 0; i < translationsRaw.length; i += 6) {
    const locale = translationsRaw[i] || 'en';
    const title = translationsRaw[i + 1] || '';
    const summary = translationsRaw[i + 2] || '';
    const bodyHtml = translationsRaw[i + 3] || '';
    const seoTitle = translationsRaw[i + 4] || '';
    const seoDescription = translationsRaw[i + 5] || '';
    const publish = translationsRaw[i + 6] === 'on' || undefined;
    translations.push({ locale, title, summary, bodyHtml, seoTitle, seoDescription, publish });
  }

  const rawIntent = formData.get('intent') as string | null;
  const intent: 'save' | 'submit' | 'publish' | 'unpublish' =
    rawIntent != null && [
      'save',
      'submit',
      'publish',
      'unpublish',
    ].includes(rawIntent as 'save' | 'submit' | 'publish' | 'unpublish')
      ? (rawIntent as 'save' | 'submit' | 'publish' | 'unpublish')
      : 'save';

  return {
    slug: (rawSlug || '').trim(),
    sectionId: (rawSectionId || '').trim(),
    featured: rawFeatured === 'on',
    sortOrder: rawSortOrder ? Number(rawSortOrder) : 0,
    coverKey: rawCoverKey || undefined,
    translations,
    intent,
  } as const;
}

export async function createPageAction(
  _previous: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parsePageFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Path is required.' };
  }
  if (!parsed.sectionId) {
    return { ..._previous, status: 'error', message: 'Section ID is required.' };
  }
  try {
    const page = await createPage(actor, {
      path: parsed.slug,
      sectionId: parsed.sectionId,
      parentPath: undefined,
      featured: parsed.featured,
      sortOrder: parsed.sortOrder,
      coverKey: parsed.coverKey,
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        summary: t.summary ?? null,
        bodyHtml: t.bodyHtml,
        seoTitle: t.seoTitle?.trim() || null,
        seoDescription: t.seoDescription?.trim() || null,
        status: t.publish ? 'PUBLISHED' : 'DRAFT',
      })),
      intent: parsed.intent,
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'page.create',
      entityType: 'Page',
      entityId: page.id,
      summary: `Created page /${page.path} (PUBLISHED)`,
    });
    revalidatePath('/admin/pages');
    return { status: 'success', message: 'Page created successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[createPageAction]', error);
    return { status: 'error', message: 'Failed to create page. Please try again.' };
  }
}

export async function updatePageAction(
  _previous: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parsePageFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Path is required.' };
  }
  try {
    const page = await updatePage(actor, parsed.slug, {
      path: parsed.slug,
      sectionId: parsed.sectionId,
      featured: parsed.featured,
      sortOrder: parsed.sortOrder,
      coverKey: parsed.coverKey,
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        summary: t.summary ?? null,
        bodyHtml: t.bodyHtml,
        seoTitle: t.seoTitle?.trim() || null,
        seoDescription: t.seoDescription?.trim() || null,
        status: t.publish ? 'PUBLISHED' : 'DRAFT',
      })),
      intent: parsed.intent,
    }, formData.get('expectedUpdatedAt') as string | undefined);
    await writeAuditLog({
      actorId: actor.id,
      action: parsed.intent === 'publish' ? 'page.publish' : 'page.update',
      entityType: 'Page',
      entityId: page.id,
      summary: `Updated page /${parsed.slug}`,
    });
    revalidatePath('/admin/pages');
    return { status: 'success', message: 'Page updated successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[updatePageAction]', error);
    return { status: 'error', message: 'Failed to update page. Please try again.' };
  }
}