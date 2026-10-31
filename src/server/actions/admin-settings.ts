'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import { updateSiteSettings } from '@/server/services/settings';
import type { AdminActionState } from '@/lib/admin-payload';
import { readPayload, toActionFailure } from '@/lib/admin-payload';

export async function updateSettingsAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = readPayload<Record<string, Record<string, string>>>(formData);

    const trimmed: Record<string, Record<string, string>> = {};
    for (const [group, values] of Object.entries(payload)) {
      if (values && typeof values === 'object') {
        trimmed[group] = Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : '']),
        );
      }
    }

    await updateSiteSettings(actor, trimmed);
    await writeAuditLog({
      actorId: actor.id,
      action: 'admin.settings.update',
      entityType: 'SiteSetting',
      entityId: null,
      summary: 'Updated site settings',
      metadata: { groups: Object.keys(trimmed) },
    });
    revalidatePath('/admin/settings');
    for (const locale of ['en', 'gu', 'hi'] as const) {
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/contact`);
    }
    return { status: 'success', message: 'Site settings updated.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to save the site settings.');
  }
}
