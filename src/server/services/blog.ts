import 'server-only';
import type { ContentStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { slugify } from '@/lib/utils';
import type { LocaleCode } from '@/lib/constants';
import { localeToPrismaLocale } from '@/i18n';
import {
  assertCanPublish,
  assertPermission,
  assertSectionAccess,
  type Actor,
} from '@/server/auth/actor';
import { writeAuditLog } from './audit';

export interface BlogTranslationInput {
  locale: LocaleCode;
  title: string;
  summary?: string | null;
  bodyHtml: string;
}

export interface BlogInput {
  slug?: string;
  sectionId: string;
  category?: string | null;
  coverKey?: string | null;
  translations: BlogTranslationInput[];
  intent: 'save' | 'publish' | 'unpublish';
}

function normalizeTranslations(input: BlogTranslationInput[]): BlogTranslationInput[] {
  const seen = new Set<string>();
  const result: BlogTranslationInput[] = [];
  for (const translation of input) {
    if (seen.has(translation.locale)) continue;
    seen.add(translation.locale);
    if (!translation.title.trim()) continue;
    result.push({
      locale: translation.locale,
      title: translation.title.trim().slice(0, 250),
      summary: translation.summary?.trim().slice(0, 500) || null,
      bodyHtml: sanitizeRichHtml(translation.bodyHtml ?? ''),
    });
  }
  return result;
}

function resolveSlug(input: string | undefined, translations: BlogTranslationInput[]): string {
  const source =
    input?.trim() ||
    translations.find((translation) => translation.locale === 'en')?.title ||
    translations[0]?.title ||
    '';
  const slug = slugify(source);
  if (!slug) throw new ValidationError('Please provide a valid blog address.');
  return slug;
}

function nextStatus(
  actor: Actor,
  sectionId: string,
  intent: BlogInput['intent'],
  current: ContentStatus,
): ContentStatus {
  if (intent === 'publish') {
    assertCanPublish(actor, sectionId);
    return 'PUBLISHED';
  }
  if (intent === 'unpublish') {
    assertCanPublish(actor, sectionId);
    return 'DRAFT';
  }
  if (current === 'PUBLISHED' && !hasPermission(actor, 'blog.publish')) {
    throw new ForbiddenError('Published posts can only be edited by staff with publishing rights.');
  }
  return current;
}

export async function createBlogPost(actor: Actor, input: BlogInput) {
  assertPermission(actor, 'blog.manage');
  assertSectionAccess(actor, input.sectionId);
  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the post title and content in at least one language.');
  }
  const slug = resolveSlug(input.slug, translations);
  const duplicate = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate) throw new ConflictError('A post with this address already exists.');
  const status: ContentStatus = input.intent === 'publish' ? 'PUBLISHED' : 'DRAFT';
  if (input.intent === 'publish') assertCanPublish(actor, input.sectionId);

  const post = await db.blogPost.create({
    data: {
      slug,
      sectionId: input.sectionId,
      category: input.category?.trim().slice(0, 100) || null,
      coverKey: input.coverKey || null,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      createdById: actor.id,
      translations: {
        create: translations.map((translation) => ({
          locale: localeToPrismaLocale(translation.locale),
          title: translation.title,
          summary: translation.summary ?? null,
          bodyHtml: translation.bodyHtml,
        })),
      },
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'blog.create',
    entityType: 'BlogPost',
    entityId: post.id,
    summary: `Created blog post ${post.slug}`,
  });
  return post;
}

export async function updateBlogPost(
  actor: Actor,
  postId: string,
  input: BlogInput,
  expectedUpdatedAt?: string,
) {
  assertPermission(actor, 'blog.manage');
  const existing = await db.blogPost.findUnique({ where: { id: postId } });
  if (!existing) throw new NotFoundError('Blog post not found.');
  assertSectionAccess(actor, existing.sectionId);
  if (input.sectionId !== existing.sectionId) assertSectionAccess(actor, input.sectionId);
  if (expectedUpdatedAt) {
    const expected = new Date(expectedUpdatedAt);
    if (Number.isFinite(expected.getTime()) && existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictError('This post was changed by someone else. Reload and try again.');
    }
  }
  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the post title and content in at least one language.');
  }
  const slug = resolveSlug(input.slug || existing.slug, translations);
  if (slug !== existing.slug) {
    const duplicate = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (duplicate) throw new ConflictError('A post with this address already exists.');
  }
  const status = nextStatus(actor, input.sectionId, input.intent, existing.status);

  await db.$transaction(async (transaction) => {
    await transaction.blogPost.update({
      where: { id: postId },
      data: {
        slug,
        sectionId: input.sectionId,
        category: input.category?.trim().slice(0, 100) || null,
        coverKey: input.coverKey || null,
        status,
        publishedAt:
          status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
    });
    await transaction.blogTranslation.deleteMany({ where: { postId } });
    await transaction.blogTranslation.createMany({
      data: translations.map((translation) => ({
        postId,
        locale: localeToPrismaLocale(translation.locale),
        title: translation.title,
        summary: translation.summary ?? null,
        bodyHtml: translation.bodyHtml,
      })),
    });
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.intent === 'publish' ? 'blog.publish' : 'blog.update',
    entityType: 'BlogPost',
    entityId: postId,
    summary: `Updated blog post ${slug}`,
    metadata: { status },
  });
  return db.blogPost.findUniqueOrThrow({ where: { id: postId } });
}

export async function archiveBlogPost(actor: Actor, postId: string): Promise<void> {
  assertPermission(actor, 'blog.manage');
  const post = await db.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Blog post not found.');
  assertSectionAccess(actor, post.sectionId);
  assertCanPublish(actor, post.sectionId);
  await db.blogPost.update({ where: { id: postId }, data: { status: 'ARCHIVED' } });
  await writeAuditLog({
    actorId: actor.id,
    action: 'blog.archive',
    entityType: 'BlogPost',
    entityId: postId,
    summary: `Archived blog post ${post.slug}`,
  });
}

export async function listBlogPostsForAdmin(
  actor: Actor,
  options: { q?: string; status?: ContentStatus | 'ALL' } = {},
) {
  assertPermission(actor, 'blog.view');
  const sections = isSuperAdmin(actor) ? undefined : actor.sections.map((item) => item.sectionId);
  if (sections && sections.length === 0) return [];
  return db.blogPost.findMany({
    where: {
      ...(sections ? { sectionId: { in: sections } } : {}),
      ...(options.status && options.status !== 'ALL' ? { status: options.status } : {}),
      ...(options.q
        ? {
            OR: [
              { slug: { contains: options.q, mode: 'insensitive' } },
              {
                translations: {
                  some: { title: { contains: options.q, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      section: { select: { nameEn: true } },
      translations: { orderBy: { locale: 'asc' } },
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getBlogPostForAdmin(actor: Actor, postId: string) {
  assertPermission(actor, 'blog.view');
  const post = await db.blogPost.findUnique({
    where: { id: postId },
    include: { section: true, translations: true },
  });
  if (!post) throw new NotFoundError('Blog post not found.');
  assertSectionAccess(actor, post.sectionId);
  return post;
}
