'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import type { AdminActionState } from '@/lib/admin-payload';
import { toActionFailure } from '@/lib/admin-payload';

const REGISTRATION_STATUSES = ['NEW', 'CONFIRMED', 'WAITLISTED', 'CANCELLED'] as const;
type RegistrationStatusValue = (typeof REGISTRATION_STATUSES)[number];

export async function updateRegistrationStatusAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    if (!hasPermission(actor, 'registration.manage') && !isSuperAdmin(actor)) {
      throw Error('You do not have permission to manage registrations.');
    }
    const id = String(formData.get('id') ?? '');
    const next = String(formData.get('status') ?? '') as RegistrationStatusValue;
    if (!(REGISTRATION_STATUSES as readonly string[]).includes(next)) {
      throw Error('Unknown status.');
    }

    const registration = await db.eventRegistration.findUnique({ where: { id } });
    if (!registration) throw Error('Registration not found.');
    const event = await db.event.findUnique({ where: { id: registration.eventId } });
    if (!event) throw Error('The event for this registration no longer exists.');
    const ownsSection =
      isSuperAdmin(actor) || actor.sections.some((section) => section.sectionId === event.sectionId);
    if (!ownsSection) throw Error('This event belongs to a section outside your access.');

    await db.eventRegistration.update({ where: { id }, data: { status: next } });
    await writeAuditLog({
      actorId: actor.id,
      action: 'registration.status',
      entityType: 'EventRegistration',
      entityId: id,
      summary: `Marked registration ${id} as ${next}`,
    });
    revalidatePath('/admin/registrations');
    return { status: 'success', message: `Registration marked ${next.toLowerCase()}.` };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to update the registration.');
  }
}
