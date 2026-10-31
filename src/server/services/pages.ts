import 'server-only';
import type { ContentStatus, Locale, Page, PageTranslation, Section } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { isValidPagePath, sanitizePagePath } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import {
  assertCanPublish,
  assertPermission,
  assertSectionAccess,
  type Actor,
} from '@/server/auth/actor';
import { writeAuditLog } from './audit';
import { getPublishedTranslation } from '@/server/public/content';
import type { LocaleCode } from '@/lib/constants';
import { localeToPrismaLocale } from '@/i18n';

export interface PageTranslationInput {
  locale: LocaleCode;
  title: string;
  summary?: string | null;
  bodyHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publish?: boolean;
}

export interface PageInput {
  path: string;
  sectionId: string;
  parentPath?: string | null;
  featured?: boolean;
  sortOrder?: number;
  coverKey?: string | null;
  translations: PageTranslationInput[];
  intent: 'save' | 'submit' | 'publish' | 'unpublish';
}

export interface PageWithTranslations extends Page {
  translations: PageTranslation[];
}

export interface PublicPage extends PageWithTranslations {
  section: Section;
}

function normalizeTranslations(input: PageTranslationInput[]): PageTranslationInput[] {
  const seen = new Set<string>();
  const result: PageTranslationInput[] = [];
  for (const translation of input) {
    if (seen.has(translation.locale)) continue;
    seen.add(translation.locale);
    if (!translation.title.trim()) continue;
    const summary = translation.summary?.trim().slice(0, 500);
    result.push({
      ...translation,
      title: translation.title.trim().slice(0, 250),
      summary: summary || null,
      bodyHtml: sanitizeRichHtml(translation.bodyHtml ?? ''),
    });
  }
  return result;
}

function desiredStatus(
  actor: Actor,
  sectionId: string,
  intent: PageInput['intent'],
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
  if (intent === 'submit') return 'IN_REVIEW';
  if (current === 'PUBLISHED') {
    if (!hasPermission(actor, 'page.publish')) {
      throw new ForbiddenError('Published pages can only be edited by staff with publishing rights.');
    }
    return 'PUBLISHED';
  }
  return 'DRAFT';
}

export async function createPage(actor: Actor, input: PageInput): Promise<Page> {
  assertPermission(actor, 'page.create');
  assertSectionAccess(actor, input.sectionId);
  const path = sanitizePagePath(input.path);
  if (!isValidPagePath(path)) {
    throw new ValidationError('Please enter a valid page address.', {
      path: 'Use lowercase letters, numbers and hyphens, separated by slashes.',
    });
  }
  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the page title and content in at least one language.');
  }
  if (input.intent === 'publish') assertCanPublish(actor, input.sectionId);
  const existing = await db.page.findUnique({ where: { path }, select: { id: true } });
  if (existing) {
    throw new ConflictError('A page with this address already exists.');
  }
  const section = await db.section.findUnique({ where: { id: input.sectionId } });
  if (!section) throw new NotFoundError('Website section not found.');

  const canPublish = input.intent === 'publish';
  if (canPublish && !translations.some((translation) => translation.publish !== false)) {
    throw new ValidationError('Select at least one language to publish.');
  }
  const pageStatus: ContentStatus =
    input.intent === 'publish' ? 'PUBLISHED' : input.intent === 'submit' ? 'IN_REVIEW' : 'DRAFT';

  const page = await db.page.create({
    data: {
      path,
      sectionId: input.sectionId,
      parentPath: input.parentPath?.replace(/^\/+|\/+$/g, '') || null,
      featured: Boolean(input.featured),
      sortOrder: input.sortOrder ?? 0,
      coverKey: input.coverKey || null,
      status: pageStatus,
      publishedAt: canPublish ? new Date() : null,
      createdById: actor.id,
      updatedById: actor.id,
      translations: {
        create: translations.map((translation) => ({
          locale: localeToPrismaLocale(translation.locale),
          title: translation.title,
          summary: translation.summary ?? null,
          bodyHtml: translation.bodyHtml,
          seoTitle: translation.seoTitle?.trim() || null,
          seoDescription: translation.seoDescription?.trim() || null,
          status: canPublish && translation.publish !== false ? 'PUBLISHED' : 'DRAFT',
        })),
      },
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: 'page.create',
    entityType: 'Page',
    entityId: page.id,
    summary: `Created page /${page.path} (${pageStatus.toLowerCase()})`,
    metadata: { path: page.path, sectionId: input.sectionId, status: pageStatus },
  });

  return page;
}

export async function updatePage(
  actor: Actor,
  pageId: string,
  input: PageInput,
  expectedUpdatedAt?: string,
): Promise<Page> {
  assertPermission(actor, 'page.edit');
  const existing = await db.page.findUnique({
    where: { id: pageId },
    include: { translations: true },
  });
  if (!existing) throw new NotFoundError('Page not found.');
  assertSectionAccess(actor, existing.sectionId);

  if (existing.status === 'PUBLISHED' && !hasPermission(actor, 'page.publish')) {
    throw new ForbiddenError('Published pages can only be edited by staff with publishing rights.');
  }
  if (expectedUpdatedAt) {
    const expected = new Date(expectedUpdatedAt);
    if (Number.isFinite(expected.getTime()) && existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictError('This page was changed by someone else. Reload the page and try again.');
    }
  }

  let path = existing.path;
  if (!existing.isSystem) {
    path = sanitizePagePath(input.path);
    if (!isValidPagePath(path)) {
      throw new ValidationError('Please enter a valid page address.', {
        path: 'Use lowercase letters, numbers and hyphens, separated by slashes.',
      });
    }
    if (path !== existing.path) {
      const duplicate = await db.page.findUnique({ where: { path }, select: { id: true } });
      if (duplicate) throw new ConflictError('A page with this address already exists.');
    }
  } else if (sanitizePagePath(input.path) !== existing.path) {
    throw new ValidationError('The address of a required website page cannot be changed.');
  }

  if (input.sectionId !== existing.sectionId) {
    if (existing.isSystem) {
      throw new ValidationError('The section of a required website page cannot be changed.');
    }
    assertSectionAccess(actor, input.sectionId);
  }
  const targetSectionId = existing.isSystem ? existing.sectionId : input.sectionId;

  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the page title and content in at least one language.');
  }

  const targetStatus = desiredStatus(actor, targetSectionId, input.intent, existing.status);
  const canPublishTranslations =
    targetStatus === 'PUBLISHED' && hasPermission(actor, 'page.publish');

  if (targetStatus === 'PUBLISHED' && canPublishTranslations) {
    const publishable = translations.filter((translation) => translation.publish !== false);
    if (publishable.length === 0) {
      throw new ValidationError('Select at least one language to publish.');
    }
    await ensureNoEmptyPublishedTranslation(publishable);
  }

  const translationLocales = translations.map((translation) => localeToPrismaLocale(translation.locale));
  const removedLocales = existing.translations
    .map((translation) => translation.locale)
    .filter((locale) => !translationLocales.includes(locale));

  await db.$transaction(async (transaction) => {
    await transaction.page.update({
      where: { id: pageId },
      data: {
        path,
        sectionId: targetSectionId,
        parentPath: input.parentPath?.replace(/^\/+|\/+$/g, '') || existing.parentPath,
        featured: Boolean(input.featured),
        sortOrder: input.sortOrder ?? existing.sortOrder,
        coverKey: input.coverKey === undefined ? existing.coverKey : input.coverKey || null,
        status: targetStatus,
        publishedAt:
          targetStatus === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
        updatedById: actor.id,
      },
    });

    await transaction.pageTranslation.deleteMany({
      where: { pageId, locale: { in: removedLocales as Locale[] } },
    });

    for (const translation of translations) {
      const locale = localeToPrismaLocale(translation.locale);
      const translationStatus: ContentStatus =
        canPublishTranslations && translation.publish !== false ? 'PUBLISHED' : 'DRAFT';
      await transaction.pageTranslation.upsert({
        where: { pageId_locale: { pageId, locale } },
        create: {
          pageId,
          locale,
          title: translation.title,
          summary: translation.summary ?? null,
          bodyHtml: translation.bodyHtml,
          seoTitle: translation.seoTitle?.trim() || null,
          seoDescription: translation.seoDescription?.trim() || null,
          status: translationStatus,
        },
        update: {
          title: translation.title,
          summary: translation.summary ?? null,
          bodyHtml: translation.bodyHtml,
          seoTitle: translation.seoTitle?.trim() || null,
          seoDescription: translation.seoDescription?.trim() || null,
          status: translationStatus,
        },
      });
    }

    for (const translation of translations) {
      await transaction.pageRevision.create({
        data: {
          pageId,
          locale: localeToPrismaLocale(translation.locale),
          title: translation.title,
          summary: translation.summary ?? null,
          bodyHtml: translation.bodyHtml,
          status: canPublishTranslations && translation.publish !== false ? 'PUBLISHED' : 'DRAFT',
          note: input.intent === 'publish' ? 'Published' : null,
          editedById: actor.id,
        },
      });
    }
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.intent === 'publish' ? 'page.publish' : 'page.update',
    entityType: 'Page',
    entityId: pageId,
    summary: `${input.intent === 'publish' ? 'Published' : 'Updated'} page /${path}`,
    metadata: { status: targetStatus, intent: input.intent },
  });

  return db.page.findUniqueOrThrow({ where: { id: pageId } });
}

async function ensureNoEmptyPublishedTranslation(
  publishable: PageTranslationInput[],
): Promise<void> {
  for (const translation of publishable) {
    if (translation.title.trim().length < 2) {
      throw new ValidationError('Published translations need a title.', {
        [`translations.${translation.locale}.title`]: 'Title is required.',
      });
    }
  }
}

export async function setPageStatus(
  actor: Actor,
  pageId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
): Promise<void> {
  const page = await db.page.findUnique({ where: { id: pageId }, include: { translations: true } });
  if (!page) throw new NotFoundError('Page not found.');
  assertSectionAccess(actor, page.sectionId, 'page.edit');
  if (status === 'PUBLISHED' || status === 'ARCHIVED' || page.status === 'PUBLISHED') {
    assertCanPublish(actor, page.sectionId);
  }
  if (status === 'PUBLISHED') {
    const hasPublishedTranslation = page.translations.some(
      (translation) => translation.status === 'PUBLISHED',
    );
    if (!hasPublishedTranslation) {
      throw new ValidationError('Publish at least one language version before publishing the page.');
    }
  }
  await db.page.update({
    where: { id: pageId },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? page.publishedAt ?? new Date() : page.publishedAt,
      updatedById: actor.id,
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: `page.${status.toLowerCase()}`,
    entityType: 'Page',
    entityId: pageId,
    summary: `Set page /${page.path} to ${status.toLowerCase()}`,
  });
}

export async function listPagesForAdmin(
  actor: Actor,
  options: { q?: string; status?: ContentStatus | 'ALL'; sectionId?: string } = {},
) {
  assertPermission(actor, 'page.view');
  const allowedSections = actor.roles.includes('SUPER_ADMIN')
    ? undefined
    : actor.sections.map((section) => section.sectionId);
  if (allowedSections && allowedSections.length === 0) return [];

  const pages = await db.page.findMany({
    where: {
      ...(allowedSections ? { sectionId: { in: allowedSections } } : {}),
      ...(options.sectionId ? { sectionId: options.sectionId } : {}),
      ...(options.status && options.status !== 'ALL' ? { status: options.status } : {}),
      ...(options.q
        ? {
            OR: [
              { path: { contains: options.q, mode: 'insensitive' } },
              {
                translations: {
                  some: {
                    OR: [
                      { title: { contains: options.q, mode: 'insensitive' } },
                      { bodyHtml: { contains: options.q, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      section: true,
      translations: { orderBy: { locale: 'asc' } },
      updatedBy: { select: { name: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { path: 'asc' }],
    take: 200,
  });
  return pages;
}

export async function getPageForAdmin(actor: Actor, pageId: string) {
  assertPermission(actor, 'page.view');
  const page = await db.page.findUnique({
    where: { id: pageId },
    include: {
      section: true,
      translations: true,
      revisions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { editedBy: { select: { name: true, email: true } } },
      },
    },
  });
  if (!page) throw new NotFoundError('Page not found.');
  assertSectionAccess(actor, page.sectionId);
  return page;
}

export async function listPageRevisions(actor: Actor, pageId: string) {
  assertPermission(actor, 'page.view');
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new NotFoundError('Page not found.');
  assertSectionAccess(actor, page.sectionId);
  return db.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
    include: { editedBy: { select: { name: true, email: true } } },
    take: 100,
  });
}

export async function restorePageRevision(actor: Actor, revisionId: string): Promise<void> {
  assertPermission(actor, 'page.restore');
  const revision = await db.pageRevision.findUnique({
    where: { id: revisionId },
    include: { page: { include: { translations: true } } },
  });
  if (!revision) throw new NotFoundError('Revision not found.');
  const page = revision.page;
  assertSectionAccess(actor, page.sectionId, 'page.edit');
  if (page.status === 'PUBLISHED') assertCanPublish(actor, page.sectionId);
  const targetTranslation = page.translations.find(
    (translation) => translation.locale === revision.locale,
  );
  if (!targetTranslation) throw new NotFoundError('The translation for this revision no longer exists.');

  await db.$transaction(async (transaction) => {
    await transaction.pageTranslation.update({
      where: { id: targetTranslation.id },
      data: {
        title: revision.title,
        summary: revision.summary,
        bodyHtml: revision.bodyHtml,
        status: page.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      },
    });
    await transaction.page.update({
      where: { id: page.id },
      data: { updatedById: actor.id },
    });
    await transaction.pageRevision.create({
      data: {
        pageId: page.id,
        locale: revision.locale,
        title: revision.title,
        summary: revision.summary,
        bodyHtml: revision.bodyHtml,
        status: page.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        note: `Restored revision from ${revision.createdAt.toISOString()}`,
        editedById: actor.id,
      },
    });
  });

  await writeAuditLog({
    actorId: actor.id,
    action: 'page.restore',
    entityType: 'Page',
    entityId: page.id,
    summary: `Restored revision of /${page.path}`,
    metadata: { revisionId, locale: revision.locale },
  });
}

export async function archivePage(actor: Actor, pageId: string): Promise<void> {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new NotFoundError('Page not found.');
  if (page.isSystem) throw new ForbiddenError('Required website pages cannot be archived.');
  assertSectionAccess(actor, page.sectionId, 'page.edit');
  assertCanPublish(actor, page.sectionId);
  await db.page.update({ where: { id: pageId }, data: { status: 'ARCHIVED', updatedById: actor.id } });
  await writeAuditLog({
    actorId: actor.id,
    action: 'page.archive',
    entityType: 'Page',
    entityId: pageId,
    summary: `Archived page /${page.path}`,
  });
}

export interface PublishedPageResult {
  page: PublicPage;
  translation: PageTranslation;
  title: string;
  isFallback: boolean;
}

export async function getPublishedPage(
  path: string,
  locale: LocaleCode,
): Promise<PublishedPageResult | null> {
  const page = await db.page.findFirst({
    where: { path, status: 'PUBLISHED' },
    include: { translations: true, section: true },
  });
  if (!page) return null;
  const translation = getPublishedTranslation(page.translations, locale);
  if (!translation) return null;
  return {
    page,
    translation,
    title: translation.title,
    isFallback: translation.locale.toLowerCase() !== locale,
  };
}

export async function getPublishedSiblingPages(
  sectionId: string,
  locale: LocaleCode,
  excludeId?: string,
) {
  const pages = await db.page.findMany({
    where: {
      sectionId,
      status: 'PUBLISHED',
      ...(excludeId ? { id: { not: excludeId } } : {}),
      translations: { some: { status: 'PUBLISHED' } },
    },
    include: { translations: true },
    orderBy: [{ sortOrder: 'asc' }, { path: 'asc' }],
  });
  return pages
    .map((page) => {
      const translation = getPublishedTranslation(page.translations, locale);
      return translation
        ? { id: page.id, path: page.path, title: translation.title }
        : null;
    })
    .filter((entry): entry is { id: string; path: string; title: string } => Boolean(entry));
}

export async function getFeaturedProgrammes(locale: LocaleCode) {
  const pages = await db.page.findMany({
    where: {
      featured: true,
      status: 'PUBLISHED',
      translations: { some: { status: 'PUBLISHED' } },
    },
    include: { translations: true },
    orderBy: [{ sortOrder: 'asc' }, { path: 'asc' }],
    take: 8,
  });
  return pages
    .map((page) => {
      const translation = getPublishedTranslation(page.translations, locale);
      if (!translation) return null;
      return {
        id: page.id,
        path: page.path,
        title: translation.title,
        summary: translation.summary ?? '',
        coverKey: page.coverKey,
        isFallback: translation.locale.toLowerCase() !== locale,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}
