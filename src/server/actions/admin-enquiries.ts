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

const ENQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'] as const;
type EnquiryStatusValue = (typeof ENQUIRY_STATUSES)[number];

export async function updateEnquiryStatusAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    if (!hasPermission(actor, 'enquiry.manage') && !isSuperAdmin(actor)) {
      throw Error('You do not have permission to manage enquiries.');
    }
    const id = String(formData.get('id') ?? '');
    const next = String(formData.get('status') ?? '') as EnquiryStatusValue;
    if (!(ENQUIRY_STATUSES as readonly string[]).includes(next)) {
      throw Error('Unknown status.');
    }

    const enquiry = await db.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw Error('Enquiry not found.');
    if (enquiry.sectionId) {
      const ownsSection = isSuperAdmin(actor) || actor.sections.some((s) => s.sectionId === enquiry.sectionId);
      if (!ownsSection) throw Error('This enquiry belongs to a section outside your access.');
    }

    await db.enquiry.update({
      where: { id },
      data:
        next === 'NEW'
          ? { status: next, handledById: null, handledAt: null }
          : { status: next, handledById: actor.id, handledAt: new Date() },
    });
    await writeAuditLog({
      actorId: actor.id,
      action: 'enquiry.status',
      entityType: 'Enquiry',
      entityId: id,
      summary: `Marked enquiry ${id} as ${next}`,
    });
    revalidatePath('/admin/enquiries');
    return { status: 'success', message: `Enquiry marked ${next.replace('_', ' ').toLowerCase()}.` };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to update the enquiry.');
  }
}
