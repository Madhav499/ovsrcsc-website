'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { createEvent, updateEvent, archiveEvent } from '@/server/services/events';
import { writeAuditLog } from '@/server/services/audit';

export interface EventFormState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
}

const _initialState: EventFormState = { status: 'idle' };

function parseEventFormData(formData: FormData) {
  const rawSlug = formData.get('slug') as string | null;
  const rawSectionId = formData.get('sectionId') as string | null;
  const rawIsPinned = formData.get('isPinned') as string | null;
  const rawStartAt = formData.get('startAt') as string | null;
  const rawEndAt = formData.get('endAt') as string | null;
  const rawAllDay = formData.get('allDay') as string | null;
  const rawLocation = formData.get('location') as string | null;
  const rawRegistrationEnabled = formData.get('registrationEnabled') as string | null;
  const rawRegistrationDeadline = formData.get('registrationDeadline') as string | null;
  const rawCapacity = formData.get('capacity') as string | null;
  const translationsRaw = formData.getAll('translation') as string[];
  const translations = [];
  for (let i = 0; i < translationsRaw.length; i += 4) {
    const locale = translationsRaw[i] as 'en' | 'gu' | 'hi' || 'en';
    const title = translationsRaw[i + 1] || '';
    const description = translationsRaw[i + 2] || '';
    const location = translationsRaw[i + 3] || undefined;
    translations.push({ locale, title, description, location });
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
    startAt: rawStartAt ? new Date(rawStartAt) : undefined,
    endAt: rawEndAt ? new Date(rawEndAt) : undefined,
    allDay: rawAllDay === 'on',
    location: rawLocation || undefined,
    registrationEnabled: rawRegistrationEnabled === 'on',
    registrationDeadline: rawRegistrationDeadline ? new Date(rawRegistrationDeadline) : undefined,
    capacity: rawCapacity ? Number(rawCapacity) : undefined,
    translations,
    intent,
  } as const;
}

// Wrap createEventAction to match useActionState signature
// Takes (_previous: EventFormState, formData: FormData)
export async function createEventFormAction(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseEventFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  if (!parsed.sectionId) {
    return { ..._previous, status: 'error', message: 'Section ID is required.' };
  }
  try {
    const event = await createEvent(actor, {
      slug: parsed.slug,
      sectionId: parsed.sectionId,
      isPinned: parsed.isPinned,
      status: 'DRAFT',
      startAt: parsed.startAt!,
      endAt: parsed.endAt,
      allDay: parsed.allDay,
      location: parsed.location,
      registrationEnabled: parsed.registrationEnabled,
      registrationDeadline: parsed.registrationDeadline,
      capacity: parsed.capacity,
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        description: t.description,
        location: t.location ?? null,
      })),
      intent: parsed.intent,
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'event.create',
      entityType: 'Event',
      entityId: event.id,
      summary: `Created event ${parsed.slug}`,
    });
    revalidatePath('/admin/events');
    return { status: 'success', message: 'Event created successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[createEventFormAction]', error);
    return { status: 'error', message: 'Failed to create event. Please try again.' };
  }
}

// Wrap updateEventAction to match useActionState signature
// Takes (_previous: EventFormState, formData: FormData)
export async function updateEventFormAction(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const parsed = parseEventFormData(formData);
  if (!parsed.slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  try {
    const event = await updateEvent(actor, parsed.slug, {
      sectionId: parsed.sectionId,
      isPinned: parsed.isPinned,
      startAt: parsed.startAt!,
      endAt: parsed.endAt,
      allDay: parsed.allDay,
      location: parsed.location,
      registrationEnabled: parsed.registrationEnabled,
      registrationDeadline: parsed.registrationDeadline,
      capacity: parsed.capacity,
      status: 'DRAFT',
      translations: parsed.translations.map((t) => ({
        locale: t.locale as 'en' | 'gu' | 'hi',
        title: t.title,
        description: t.description,
        location: t.location ?? null,
      })),
      intent: parsed.intent,
    }, formData.get('expectedUpdatedAt') as string | undefined);
    await writeAuditLog({
      actorId: actor.id,
      action: parsed.intent === 'publish' ? 'event.publish' : 'event.update',
      entityType: 'Event',
      entityId: event.id,
      summary: `Updated event ${parsed.slug}`,
      metadata: { status: event.status },
    });
    revalidatePath('/admin/events');
    return { status: 'success', message: 'Event updated successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[updateEventFormAction]', error);
    return { status: 'error', message: 'Failed to update event. Please try again.' };
  }
}

// Wrap archiveEventAction to match useActionState signature
// Takes (_previous: EventFormState, formData: FormData)
export async function archiveEventFormAction(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await assertSameOrigin();
  const actor = await requireActor();
  const slug = (formData.get('slug') as string | null)?.trim();
  if (!slug) {
    return { ..._previous, status: 'error', message: 'Slug is required.' };
  }
  try {
    await archiveEvent(actor, slug);
    await writeAuditLog({
      actorId: actor.id,
      action: 'event.archive',
      entityType: 'Event',
      entityId: slug,
      summary: `Archived event ${slug}`,
    });
    revalidatePath('/admin/events');
    return { status: 'success', message: 'Event archived successfully.' };
  } catch (error) {
    if (isAppError(error)) {
      return {
        status: 'error',
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error('[archiveEventFormAction]', error);
    return { status: 'error', message: 'Failed to archive event. Please try again.' };
  }
}