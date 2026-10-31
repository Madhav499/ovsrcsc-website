import 'server-only';
import type { ContentStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { isSafeLinkHref, slugify } from '@/lib/utils';
import type { LocaleCode } from '@/lib/constants';
import { localeToPrismaLocale } from '@/i18n';
import {
  assertCanPublish,
  assertPermission,
  assertSectionAccess,
  type Actor,
} from '@/server/auth/actor';
import { writeAuditLog } from './audit';

export interface NoticeTranslationInput {
  locale: LocaleCode;
  title: string;
  bodyHtml: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
}

export interface NoticeInput {
  slug?: string;
  sectionId: string;
  isPinned: boolean;
  publishAt?: Date | null;
  expireAt?: Date | null;
  attachmentIds: string[];
  translations: NoticeTranslationInput[];
  intent: 'save' | 'publish' | 'unpublish';
}

function normalizeTranslations(input: NoticeTranslationInput[]): NoticeTranslationInput[] {
  const seen = new Set<string>();
  const result: NoticeTranslationInput[] = [];
  for (const translation of input) {
    if (seen.has(translation.locale)) continue;
    seen.add(translation.locale);
    if (!translation.title.trim()) continue;
    const linkUrl = translation.linkUrl?.trim() ?? '';
    result.push({
      locale: translation.locale,
      title: translation.title.trim().slice(0, 250),
      bodyHtml: sanitizeRichHtml(translation.bodyHtml ?? ''),
      linkUrl: linkUrl && isSafeLinkHref(linkUrl) ? linkUrl : null,
      linkLabel: translation.linkLabel?.trim().slice(0, 120) || null,
    });
  }
  return result;
}

function resolveSlug(input: string | undefined, translations: NoticeTranslationInput[]): string {
  const source =
    input?.trim() ||
    translations.find((translation) => translation.locale === 'en')?.title ||
    translations[0]?.title ||
    '';
  const slug = slugify(source);
  if (!slug) throw new ValidationError('Please provide a valid notice address.');
  return slug;
}

function validateDates(publishAt?: Date | null, expireAt?: Date | null) {
  if (publishAt && !Number.isFinite(publishAt.getTime())) {
    throw new ValidationError('Please provide a valid publish date.');
  }
  if (expireAt && !Number.isFinite(expireAt.getTime())) {
    throw new ValidationError('Please provide a valid expiry date.');
  }
  if (publishAt && expireAt && expireAt <= publishAt) {
    throw new ValidationError('The expiry date must be after the publish date.');
  }
}

function nextStatus(
  actor: Actor,
  sectionId: string,
  intent: NoticeInput['intent'],
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
  if (current === 'PUBLISHED' && !hasPermission(actor, 'notice.publish')) {
    throw new ForbiddenError('Published notices can only be edited by staff with publishing rights.');
  }
  return current;
}

export async function createNotice(actor: Actor, input: NoticeInput) {
  assertPermission(actor, 'notice.manage');
  assertSectionAccess(actor, input.sectionId);
  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the notice title and text in at least one language.');
  }
  validateDates(input.publishAt, input.expireAt);
  const slug = resolveSlug(input.slug, translations);
  const duplicate = await db.notice.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate) throw new ConflictError('A notice with this address already exists.');

  const status: ContentStatus = input.intent === 'publish' ? 'PUBLISHED' : 'DRAFT';
  if (input.intent === 'publish') assertCanPublish(actor, input.sectionId);
  const attachmentIds = [...new Set(input.attachmentIds)].filter(Boolean);

  const notice = await db.notice.create({
    data: {
      slug,
      sectionId: input.sectionId,
      status,
      isPinned: input.isPinned,
      publishAt: input.publishAt ?? (status === 'PUBLISHED' ? new Date() : null),
      expireAt: input.expireAt || null,
      createdById: actor.id,
      updatedById: actor.id,
      translations: {
        create: translations.map((translation) => ({
          locale: localeToPrismaLocale(translation.locale),
          title: translation.title,
          bodyHtml: translation.bodyHtml,
          linkUrl: translation.linkUrl ?? null,
          linkLabel: translation.linkLabel ?? null,
        })),
      },
      attachments: {
        create: attachmentIds.map((mediaId) => ({ mediaId })),
      },
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'notice.create',
    entityType: 'Notice',
    entityId: notice.id,
    summary: `Created notice ${notice.slug}`,
  });
  return notice;
}

export async function updateNotice(
  actor: Actor,
  noticeId: string,
  input: NoticeInput,
  expectedUpdatedAt?: string,
) {
  assertPermission(actor, 'notice.manage');
  const existing = await db.notice.findUnique({ where: { id: noticeId } });
  if (!existing) throw new NotFoundError('Notice not found.');
  assertSectionAccess(actor, existing.sectionId);
  if (input.sectionId !== existing.sectionId) assertSectionAccess(actor, input.sectionId);
  if (expectedUpdatedAt) {
    const expected = new Date(expectedUpdatedAt);
    if (Number.isFinite(expected.getTime()) && existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictError('This notice was changed by someone else. Reload and try again.');
    }
  }

  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the notice title and text in at least one language.');
  }
  validateDates(input.publishAt, input.expireAt);
  const slug = resolveSlug(input.slug || existing.slug, translations);
  if (slug !== existing.slug) {
    const duplicate = await db.notice.findUnique({ where: { slug }, select: { id: true } });
    if (duplicate) throw new ConflictError('A notice with this address already exists.');
  }
  const status = nextStatus(actor, input.sectionId, input.intent, existing.status);
  const attachmentIds = [...new Set(input.attachmentIds)].filter(Boolean);

  await db.$transaction(async (transaction) => {
    await transaction.notice.update({
      where: { id: noticeId },
      data: {
        slug,
        sectionId: input.sectionId,
        status,
        isPinned: input.isPinned,
        publishAt: input.publishAt ?? (status === 'PUBLISHED' ? existing.publishAt ?? new Date() : null),
        expireAt: input.expireAt || null,
        updatedById: actor.id,
      },
    });
    await transaction.noticeTranslation.deleteMany({ where: { noticeId } });
    await transaction.noticeTranslation.createMany({
      data: translations.map((translation) => ({
        noticeId,
        locale: localeToPrismaLocale(translation.locale),
        title: translation.title,
        bodyHtml: translation.bodyHtml,
        linkUrl: translation.linkUrl ?? null,
        linkLabel: translation.linkLabel ?? null,
      })),
    });
    await transaction.noticeAttachment.deleteMany({ where: { noticeId } });
    if (attachmentIds.length > 0) {
      await transaction.noticeAttachment.createMany({
        data: attachmentIds.map((mediaId) => ({ noticeId, mediaId })),
      });
    }
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.intent === 'publish' ? 'notice.publish' : 'notice.update',
    entityType: 'Notice',
    entityId: noticeId,
    summary: `Updated notice ${slug}`,
    metadata: { status },
  });
  return db.notice.findUniqueOrThrow({ where: { id: noticeId } });
}

export async function archiveNotice(actor: Actor, noticeId: string): Promise<void> {
  assertPermission(actor, 'notice.manage');
  const notice = await db.notice.findUnique({ where: { id: noticeId } });
  if (!notice) throw new NotFoundError('Notice not found.');
  assertSectionAccess(actor, notice.sectionId);
  assertCanPublish(actor, notice.sectionId);
  await db.notice.update({
    where: { id: noticeId },
    data: { status: 'ARCHIVED', updatedById: actor.id },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'notice.archive',
    entityType: 'Notice',
    entityId: noticeId,
    summary: `Archived notice ${notice.slug}`,
  });
}

export async function listNoticesForAdmin(
  actor: Actor,
  _options: { q?: string; status?: ContentStatus | 'ALL'; sectionId?: string } = {},
) {
  assertPermission(actor, 'notice.view');
  const sections = isSuperAdmin(actor) ? undefined : actor.sections.map((item) => item.sectionId);
  if (sections && sections.length === 0) return [];
  return db.notice.findMany({
    where: {},
    include: {
      section: { select: { id: true, nameEn: true } },
      translations: { orderBy: { locale: 'asc' } },
      _count: { select: { attachments: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getNoticeForAdmin(actor: Actor, noticeId: string) {
  assertPermission(actor, 'notice.view');
  const notice = await db.notice.findUnique({
    where: { id: noticeId },
    include: {
      section: true,
      translations: true,
      attachments: { include: { media: true } },
    },
  });
  if (!notice) throw new NotFoundError('Notice not found.');
  assertSectionAccess(actor, notice.sectionId);
  return notice;
}