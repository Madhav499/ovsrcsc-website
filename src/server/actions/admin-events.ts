'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { createEvent, updateEvent, archiveEvent } from '@/server/services/events';
import { parseInstitutionLocal } from '@/lib/dates';
import type { ContentStatus } from '@prisma/client';
import type { AdminActionState } from '@/lib/admin-payload';
import { toActionFailure } from '@/lib/admin-payload';

interface EventPayload {
  slug?: string;
  sectionId?: string;
  allDay?: boolean;
  startAt?: string;
  endAt?: string | null;
  location?: string;
  registrationEnabled?: boolean;
  registrationDeadline?: string | null;
  capacity?: number | null;
  publish?: boolean;
  wasPublished?: boolean;
  coverKey?: string | null;
  translations?: Array<{ locale?: string; title?: string; description?: string; location?: string }>;
}

function dateFromInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = parseInstitutionLocal(value) ?? new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveEventAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = JSON.parse(String(formData.get('payload') ?? '{}')) as EventPayload;
    const id = String(formData.get('id') ?? '');
    const sectionId = payload.sectionId ?? '';
    if (!sectionId) throw Error('Choose a section for this event.');
    const startAt = dateFromInput(payload.startAt) ?? new Date(NaN);
    if (Number.isNaN(startAt.getTime())) throw Error('Choose a valid start date and time.');

    const translations = (payload.translations ?? []).map((translation) => ({
      locale: (translation.locale ?? 'en') as 'en' | 'gu' | 'hi',
      title: translation.title ?? '',
      description: translation.description ?? '',
      location: translation.location?.trim() ? translation.location.trim() : null,
    }));

    const shared = {
      sectionId,
      isPinned: false,
      startAt,
      endAt: dateFromInput(payload.endAt ?? null),
      allDay: Boolean(payload.allDay),
      location: payload.location?.trim() ? payload.location.trim() : null,
      registrationEnabled: Boolean(payload.registrationEnabled),
      registrationDeadline: dateFromInput(payload.registrationDeadline ?? null),
      capacity:
        payload.registrationEnabled && payload.capacity != null && !Number.isNaN(Number(payload.capacity))
          ? Math.max(0, Math.round(Number(payload.capacity)))
          : null,
      coverKey: payload.coverKey?.trim() ? payload.coverKey.trim() : null,
      translations,
      intent:
        payload.publish === true
          ? ('publish' as const)
          : payload.publish === false && payload.wasPublished === true
            ? ('unpublish' as const)
            : ('save' as const),
      status: (payload.publish ? 'PUBLISHED' : 'DRAFT') as ContentStatus,
    };

    if (id) {
      const event = await updateEvent(actor, id, { ...shared, slug: payload.slug?.trim() || undefined });
      await writeAuditLog({
        actorId: actor.id,
        action: 'event.update',
        entityType: 'Event',
        entityId: event.id,
        summary: `Updated event ${event.slug}`,
        metadata: { status: event.status },
      });
    } else {
      const event = await createEvent(actor, { ...shared, slug: payload.slug?.trim() || undefined });
      await writeAuditLog({
        actorId: actor.id,
        action: 'event.create',
        entityType: 'Event',
        entityId: event.id,
        summary: `Created event ${event.slug} (${event.status})`,
      });
    }

    revalidatePath('/admin/events');
    revalidatePath('/en/events');
    revalidatePath('/gu/events');
    revalidatePath('/hi/events');
    return { status: 'success', message: id ? 'Event updated.' : 'Event created.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save event. Please try again.');
  }
}

export async function archiveEventAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const id = String(formData.get('id') ?? '');
    await archiveEvent(actor, id);
    await writeAuditLog({
      actorId: actor.id,
      action: 'event.archive',
      entityType: 'Event',
      entityId: id,
      summary: `Archived event ${id}`,
    });
    revalidatePath('/admin/events');
    return { status: 'success', message: 'Event archived.' };
  } catch (error) {
    return toActionFailure(error, 'Failed to archive event.');
  }
}
