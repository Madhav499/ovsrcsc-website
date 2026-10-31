'use server';

import { db } from '@/lib/db';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { slugify } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { announcementDisplayState } from '@/lib/announcement';
import { writeAuditLog } from './audit';
import type { Actor } from '@/server/auth/actor';

export interface AnnouncementTranslationInput {
  locale: string;
  title: string;
  message: string;
  linkLabel?: string | null;
}

export interface AnnouncementInput {
  sectionId: string;
  enabled: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  startAt: Date | string | null;
  endAt: Date | string | null;
  linkUrl?: string | null;
  imageKey?: string | null;
  translations: AnnouncementTranslationInput[];
  intent: 'save' | 'publish' | 'unarchive';
}

function normalizeTranslations(input: AnnouncementTranslationInput[]): AnnouncementTranslationInput[] {
  const seen = new Set<string>();
  const result: AnnouncementTranslationInput[] = [];
  for (const translation of input) {
    if (seen.has(translation.locale)) continue;
    seen.add(translation.locale);
    if (!translation.title.trim()) continue;
    const linkLabel = translation.linkLabel?.trim().slice(0, 120) || null;
    result.push({
      locale: translation.locale,
      title: translation.title.trim().slice(0, 250),
      message: sanitizeRichHtml(translation.message ?? ''),
      linkLabel,
    });
  }
  return result;
}

function validateDates(startAt: Date | string | null, endAt: Date | string | null) {
  if (startAt) {
    const startDate = new Date(startAt);
    if (!Number.isFinite(startDate.getTime())) {
      throw new ValidationError('Please provide a valid start date.');
    }
  }
  if (endAt) {
    const endDate = new Date(endAt);
    if (!Number.isFinite(endDate.getTime())) {
      throw new ValidationError('Please provide a valid end date.');
    }
  }
  if (startAt && endAt) {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt).getTime();
    if (endTime <= startTime) {
      throw new ValidationError('The end date must be after the start date.');
    }
  }
}

export async function listAnnouncementsForAdmin(actor: Actor, sectionId?: string) {
  const where = sectionId ? { sectionId, enabled: true } : { enabled: true };

  const items = await db.announcement.findMany({
    where,
    orderBy: { startAt: 'desc' },
  });

  const sectionIds = items.map((a) => a.sectionId).filter((id): id is string => id != null);
  const uniqueSectionIds = [...new Set(sectionIds)];
  const sections = await db.section.findMany({
    where: { id: { in: uniqueSectionIds } },
    select: { id: true, nameEn: true },
  });
  const sectionMap = new Map(
    sections.map((s) => [s.id, s.nameEn]),
  );

  return items.map((a) => {
    const secName = sectionMap.has(a.sectionId as string) ? sectionMap.get(a.sectionId as string)!.toString() : '—';
    return {
      id: a.id,
      section: secName,
      enabled: a.enabled,
      status: a.status,
      startAt: a.startAt,
      endAt: a.endAt,
      linkUrl: a.linkUrl,
      imageKey: a.imageKey,
      displayState: announcementDisplayState({
        enabled: a.enabled,
        status: a.status,
        startAt: a.startAt,
        endAt: a.endAt,
        timezone: a.timezone,
      }),
    };
  });
}

export async function createAnnouncement(actor: Actor, input: AnnouncementInput) {
  if (!hasPermission(actor, 'announcement.manage')) {
    throw new ForbiddenError('You do not have permission to create announcements.');
  }

  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add at least one translation with a title.');
  }

  validateDates(input.startAt, input.endAt);

  const section = await db.section.findUnique({
    where: { id: input.sectionId },
  });
  if (!section) {
    throw new NotFoundError('Section not found.');
  }

  const slug = slugify(input.translations[0]?.title || 'announcement');

  const startDate = input.startAt ? new Date(input.startAt) : new Date();
  const endDate = input.endAt ? new Date(input.endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const announcement = await db.announcement.create({
    data: {
      sectionId: input.sectionId,
      enabled: input.enabled,
      status: input.status,
      startAt: startDate,
      endAt: endDate,
      timezone: 'Asia/Kolkata',
      linkUrl: input.linkUrl,
      imageKey: input.imageKey,
      slug,
      createdById: actor.id,
      translations: {
        create: translations.map((t) => ({
          locale: t.locale.toUpperCase() as 'EN' | 'GU' | 'HI',
          title: t.title,
          message: t.message,
          linkLabel: t.linkLabel,
        })),
      },
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: 'announcement.create',
    entityType: 'Announcement',
    entityId: announcement.id,
    summary: `Created announcement ${announcement.id}`,
  });

  return {
    id: announcement.id,
    section: announcement.sectionId ? (await db.section.findUnique({ where: { id: announcement.sectionId } }))?.nameEn || '—' : '—',
    enabled: announcement.enabled,
    status: announcement.status,
    startAt: announcement.startAt,
    endAt: announcement.endAt,
    linkUrl: announcement.linkUrl,
    imageKey: announcement.imageKey,
    displayState: announcementDisplayState({
      enabled: announcement.enabled,
      status: announcement.status,
      startAt: announcement.startAt,
      endAt: announcement.endAt,
      timezone: announcement.timezone,
    }),
  };
}

export async function updateAnnouncement(actor: Actor, id: string, input: AnnouncementInput) {
  if (!hasPermission(actor, 'announcement.manage')) {
    throw new ForbiddenError('You do not have permission to edit announcements.');
  }

  const existing = await db.announcement.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError('Announcement not found.');
  }

  const section = await db.section.findUnique({
    where: { id: input.sectionId },
  });
  if (!section) {
    throw new NotFoundError('Section not found.');
  }

  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add at least one translation with a title.');
  }

  const startDate = input.startAt ? new Date(input.startAt) : new Date();
  const endDate = input.endAt ? new Date(input.endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const announcement = await db.announcement.update({
    where: { id },
    data: {
      sectionId: input.sectionId,
      enabled: input.enabled,
      status: input.status,
      startAt: startDate,
      endAt: endDate,
      timezone: 'Asia/Kolkata',
      linkUrl: input.linkUrl,
      imageKey: input.imageKey,
      translations: {
        deleteMany: {},
        create: translations.map((t) => ({
          locale: t.locale.toUpperCase() as 'EN' | 'GU' | 'HI',
          title: t.title,
          message: t.message,
          linkLabel: t.linkLabel,
        })),
      },
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.status === 'ARCHIVED' ? 'announcement.archive' : 'announcement.update',
    entityType: 'Announcement',
    entityId: announcement.id,
    summary: `Updated announcement ${announcement.id}`,
  });

  return {
    id: announcement.id,
    section: announcement.sectionId ? (await db.section.findUnique({ where: { id: announcement.sectionId } }))?.nameEn || '—' : '—',
    enabled: announcement.enabled,
    status: announcement.status,
    startAt: announcement.startAt,
    endAt: announcement.endAt,
    linkUrl: announcement.linkUrl,
    imageKey: announcement.imageKey,
    displayState: announcementDisplayState({
      enabled: announcement.enabled,
      status: announcement.status,
      startAt: announcement.startAt,
      endAt: announcement.endAt,
      timezone: announcement.timezone,
    }),
  };
}

export async function archiveAnnouncement(actor: Actor, id: string) {
  if (!hasPermission(actor, 'announcement.manage')) {
    throw new ForbiddenError('You do not have permission to archive announcements.');
  }

  const existing = await db.announcement.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError('Announcement not found.');
  }

  const announcement = await db.announcement.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: 'announcement.archive',
    entityType: 'Announcement',
    entityId: announcement.id,
    summary: `Archived announcement ${announcement.id}`,
  });

  return { success: true };
}
