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

export interface EventTranslationInput {
  locale: LocaleCode;
  title: string;
  description: string;
  location?: string | null;
}

export interface EventInput {
  slug?: string;
  sectionId: string;
  isPinned: boolean;
  status: ContentStatus;
  startAt: Date;
  endAt?: Date | null;
  allDay: boolean;
  location?: string | null;
  registrationEnabled: boolean;
  registrationDeadline?: Date | null;
  capacity?: number | null;
  translations: EventTranslationInput[];
  intent: 'save' | 'publish' | 'unpublish';
}

function normalizeTranslations(input: EventTranslationInput[]): EventTranslationInput[] {
  const seen = new Set<string>();
  const result: EventTranslationInput[] = [];
  for (const translation of input) {
    if (seen.has(translation.locale)) continue;
    seen.add(translation.locale);
    if (!translation.title.trim()) continue;
    if (!translation.description.trim()) continue;
    result.push({
      locale: translation.locale,
      title: translation.title.trim().slice(0, 250),
      description: sanitizeRichHtml(translation.description ?? ''),
      location: translation.location?.trim() ?? null,
    });
  }
  return result;
}

function resolveSlug(input: string | undefined, translations: EventTranslationInput[]): string {
  const source =
    input?.trim() ||
    translations.find((translation) => translation.locale === 'en')?.title ||
    translations[0]?.title ||
    '';
  const slug = slugify(source);
  if (!slug) throw new ValidationError('Please provide a valid event address.');
  return slug;
}

function validateDates(startAt: Date, endAt?: Date | null) {
  if (!Number.isFinite(startAt.getTime())) {
    throw new ValidationError('Please provide a valid start date.');
  }
  if (endAt && !Number.isFinite(endAt.getTime())) {
    throw new ValidationError('Please provide a valid end date.');
  }
}

function nextStatus(
  actor: Actor,
  sectionId: string,
  intent: EventInput['intent'],
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
  if (current === 'PUBLISHED' && !hasPermission(actor, 'event.publish')) {
    throw new ForbiddenError('Published events can only be edited by staff with publishing rights.');
  }
  return current;
}

export async function createEvent(actor: Actor, input: EventInput) {
  assertPermission(actor, 'event.manage');
  assertSectionAccess(actor, input.sectionId);
  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the event title and description in at least one language.');
  }
  validateDates(input.startAt, input.endAt);
  const slug = resolveSlug(input.slug, translations);
  const duplicate = await db.event.findUnique({ where: { slug }, select: { id: true } });
  if (duplicate) throw new ConflictError('An event with this address already exists.');

  const status: ContentStatus = input.intent === 'publish' ? 'PUBLISHED' : 'DRAFT';
  if (input.intent === 'publish') assertCanPublish(actor, input.sectionId);

const event = await db.event.create({
    data: {
      slug,
      sectionId: input.sectionId,
      status,
      isPinned: input.isPinned,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      allDay: input.allDay,
      location: input.location ?? null,
      registrationEnabled: input.registrationEnabled,
      registrationDeadline: input.registrationDeadline ?? null,
      capacity: input.capacity ?? null,
      createdById: actor.id,
      updatedById: actor.id,
      translations: {
        create: translations.map((translation) => ({
          locale: localeToPrismaLocale(translation.locale),
          title: translation.title,
          description: translation.description,
          location: translation.location ?? null,
        })),
      },
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'event.create',
    entityType: 'Event',
    entityId: event.id,
    summary: `Created event ${event.slug}`,
  });
  return event;
}

export async function updateEvent(
  actor: Actor,
  eventId: string,
  input: EventInput,
  expectedUpdatedAt?: string,
) {
  assertPermission(actor, 'event.manage');
  const existing = await db.event.findUnique({ where: { id: eventId } });
  if (!existing) throw new NotFoundError('Event not found.');
  assertSectionAccess(actor, existing.sectionId);
  if (input.sectionId !== existing.sectionId) assertSectionAccess(actor, input.sectionId);
  if (expectedUpdatedAt) {
    const expected = new Date(expectedUpdatedAt);
    if (Number.isFinite(expected.getTime()) && existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictError('This event was changed by someone else. Reload and try again.');
    }
  }

  const translations = normalizeTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Add the event title and description in at least one language.');
  }
  validateDates(input.startAt, input.endAt);
  const slug = resolveSlug(input.slug || existing.slug, translations);
  if (slug !== existing.slug) {
    const duplicate = await db.event.findUnique({ where: { slug }, select: { id: true } });
    if (duplicate) throw new ConflictError('An event with this address already exists.');
  }
  const status = nextStatus(actor, input.sectionId, input.intent, existing.status);

await db.$transaction(async (transaction) => {
    await transaction.event.update({
      where: { id: eventId },
      data: {
        slug,
        sectionId: input.sectionId,
        status,
        isPinned: input.isPinned,
        startAt: input.startAt,
        endAt: input.endAt ?? existing.endAt,
        allDay: input.allDay,
        location: input.location ?? existing.location,
        registrationEnabled: input.registrationEnabled,
        registrationDeadline: input.registrationDeadline ?? existing.registrationDeadline,
        capacity: input.capacity ?? existing.capacity,
        updatedById: actor.id,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any,
    });
    await transaction.eventTranslation.deleteMany({ where: { eventId } });
    await transaction.eventTranslation.createMany({
      data: translations.map((translation) => ({
        eventId,
        locale: localeToPrismaLocale(translation.locale),
        title: translation.title,
        description: translation.description,
        location: translation.location ?? null,
      })),
    });
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.intent === 'publish' ? 'event.publish' : 'event.update',
    entityType: 'Event',
    entityId: eventId,
    summary: `Updated event ${slug}`,
    metadata: { status },
  });
  return db.event.findUniqueOrThrow({ where: { id: eventId } });
}

export async function archiveEvent(actor: Actor, eventId: string): Promise<void> {
  assertPermission(actor, 'event.manage');
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Event not found.');
  assertSectionAccess(actor, event.sectionId);
  assertCanPublish(actor, event.sectionId);
  await db.event.update({
    where: { id: eventId },
    data: { status: 'ARCHIVED' },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'event.archive',
    entityType: 'Event',
    entityId: eventId,
    summary: `Archived event ${event.slug}`,
  });
}

export async function listEventsForAdmin(
  actor: Actor,
  _options: { q?: string; status?: ContentStatus | 'ALL'; sectionId?: string } = {},
) {
  assertPermission(actor, 'event.view');
  const sections = isSuperAdmin(actor) ? undefined : actor.sections.map((item) => item.sectionId);
  if (sections && sections.length === 0) return [];
  return db.event.findMany({
    where: {},
    include: {
      section: { select: { id: true, nameEn: true } },
      translations: { orderBy: { locale: 'asc' } },
    },
    orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getEventForAdmin(actor: Actor, eventId: string) {
  assertPermission(actor, 'event.view');
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      section: true,
      translations: true,
    },
  });
  if (!event) throw new NotFoundError('Event not found.');
  assertSectionAccess(actor, event.sectionId);
  return event;
}

export async function registerForEvent(
  eventId: string,
  data: { name: string; email: string; phone: string; participants?: number; notes?: string; locale?: LocaleCode; ipHash?: string }
) {
  const registration = await db.eventRegistration.create({
    data: {
      eventId,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      participants: data.participants ?? 1,
      notes: data.notes,
      status: 'NEW',
      locale: localeToPrismaLocale(data.locale ?? 'en'),
      ipHash: data.ipHash,
    },
  });
  await writeAuditLog({
    actorId: 'system',
    action: 'event.registration',
    entityType: 'EventRegistration',
    entityId: registration.id,
    summary: `Registered participant for event ${eventId}`,
  });
  return registration;
}