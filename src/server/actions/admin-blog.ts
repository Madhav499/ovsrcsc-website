'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createBlogPost, updateBlogPost, archiveBlogPost } from '@/server/services/blog';
import { parseInstitutionLocal } from '@/lib/dates';
import type { AdminActionState } from '@/lib/admin-payload';
import { toActionFailure } from '@/lib/admin-payload';

interface BlogPayload {
  slug?: string;
  sectionId?: string;
  category?: string;
  coverKey?: string | null;
  publish?: boolean;
  wasPublished?: boolean;
  publishedAt?: string | null;
  translations?: Array<{ locale?: string; title?: string; summary?: string; bodyHtml?: string }>;
}

export async function saveBlogPostAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = JSON.parse(String(formData.get('payload') ?? '{}')) as BlogPayload;
    const id = String(formData.get('id') ?? '');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a section for this post.');

    const translations = (payload.translations ?? []).map((translation) => ({
      locale: (translation.locale ?? 'en') as 'en' | 'gu' | 'hi',
      title: translation.title ?? '',
      summary: translation.summary?.trim() ? translation.summary.trim() : null,
      bodyHtml: translation.bodyHtml ?? '',
    }));

    const shared = {
      sectionId,
      category: payload.category?.trim() ? payload.category.trim() : null,
      coverKey: payload.coverKey?.trim() ? payload.coverKey.trim() : null,
      translations,
      intent:
        payload.publish === true
          ? ('publish' as const)
          : payload.publish === false && payload.wasPublished === true
            ? ('unpublish' as const)
            : ('save' as const),
    };

    const post = id
      ? await updateBlogPost(actor, id, { ...shared, slug: payload.slug?.trim() || undefined }, String(formData.get('expectedUpdatedAt') ?? '') || undefined)
      : await createBlogPost(actor, { ...shared, slug: payload.slug?.trim() || undefined });

    // Honour an explicit backdated publication date if provided while publishing.
    if (payload.publishedAt) {
      const publishedAt = parseInstitutionLocal(payload.publishedAt);
      if (publishedAt && post.status === 'PUBLISHED') {
        const { db } = await import('@/lib/db');
        await db.blogPost.update({ where: { id: post.id }, data: { publishedAt } });
      }
    }

    await writeAuditLog({
      actorId: actor.id,
      action: id ? 'blog.update' : 'blog.create',
      entityType: 'BlogPost',
      entityId: post.id,
      summary: `${id ? 'Updated' : 'Created'} blog post ${post.slug}`,
      metadata: { status: post.status },
    });

    revalidatePath('/admin/blog');
    for (const locale of ['en', 'gu', 'hi'] as const) {
      revalidatePath(`/${locale}/blog`);
      revalidatePath(`/${locale}/blog/${post.slug}`);
    }
    return { status: 'success', message: id ? 'Post updated.' : 'Post created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save the post. Please try again.');
  }
}

export async function archiveBlogPostAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archiveBlogPost(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'blog.archive',
      entityType: 'BlogPost',
      entityId: id,
      summary: `Archived blog post ${id}`,
    });
    revalidatePath('/admin/blog');
    return { status: 'success', message: 'Post archived.' };
  } catch (error) {
    return toActionFailure(error, 'Failed to archive the post.');
  }
}
