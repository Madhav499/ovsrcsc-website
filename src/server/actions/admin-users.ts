'use server';

import { revalidatePath } from 'next/cache';
import { isAppError } from '@/lib/errors';
import { assertSameOrigin } from '@/server/auth/csrf';
import { requireActor } from '@/server/auth/actor';
import { writeAuditLog } from '@/server/services/audit';
import {
  createUserForAdmin,
  updateUserForAdmin,
  resetUserPasswordForAdmin,
  type CreateUserInput,
} from '@/server/services/users';
import type { Role, UserStatus } from '@prisma/client';
import type { AdminActionState } from '@/lib/admin-payload';
import { readPayload, toActionFailure } from '@/lib/admin-payload';

const ROLES: Role[] = ['SUPER_ADMIN', 'EVENTS_MANAGER', 'SECTION_EDITOR', 'CONTENT_CONTRIBUTOR'];
const STATUSES: UserStatus[] = ['ACTIVE', 'DISABLED'];

interface UserPayload {
  name?: string;
  email?: string;
  roles?: string[];
  status?: string;
  sections?: Array<{ sectionId?: string; canPublish?: boolean }>;
  passwordOption?: string;
  temporaryPassword?: string;
}

export async function createUserAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const payload = readPayload<UserPayload>(formData);

    const email = (payload.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) throw Error('Please provide a valid email address.');
    const name = (payload.name ?? '').trim();
    if (!name) throw Error('Please provide a name for the team member.');
    const roles = (payload.roles ?? []).filter((role): role is Role =>
      (ROLES as string[]).includes(role),
    );
    if (roles.length === 0) throw Error('Select at least one role.');
    const sections = (payload.sections ?? [])
      .filter((section) => section.sectionId)
      .map((section) => ({ sectionId: section.sectionId as string, canPublish: Boolean(section.canPublish) }));

    let temporaryPassword: string | undefined;
    if ((payload.passwordOption ?? 'generate') === 'manual') {
      temporaryPassword = (payload.temporaryPassword ?? '').trim();
      if (!temporaryPassword) throw Error('Please enter a temporary password.');
    }

    const input: CreateUserInput = { name, email, roles, sections, temporaryPassword };
    const { user, temporaryPassword: issuedPassword } = await createUserForAdmin(actor, input);
    await writeAuditLog({
      actorId: actor.id,
      action: 'admin.user.create',
      entityType: 'User',
      entityId: user.id,
      summary: `Created team member ${email} (temporary password issued)`,
      metadata: { roles },
    });
    revalidatePath('/admin/users');
    return {
      status: 'success',
      message: 'Team member added.',
      temporaryPassword: issuedPassword,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((role) => role.role),
        sections: user.sections.map((section) => ({
          sectionId: section.sectionId,
          canPublish: section.canPublish,
        })),
      },
    };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to add the team member.');
  }
}

export async function updateUserAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const targetUserId = String(formData.get('id') ?? '');
    const payload = readPayload<UserPayload>(formData);

    const name = (payload.name ?? '').trim();
    if (!name) throw Error('Please provide a name for the team member.');
    const roles = (payload.roles ?? []).filter((role): role is Role =>
      (ROLES as string[]).includes(role),
    );
    if (roles.length === 0) throw Error('Select at least one role.');
    const status = (STATUSES as string[]).includes(payload.status ?? '') ? (payload.status as UserStatus) : 'ACTIVE';
    const sections = (payload.sections ?? [])
      .filter((section) => section.sectionId)
      .map((section) => ({ sectionId: section.sectionId as string, canPublish: Boolean(section.canPublish) }));

    await updateUserForAdmin(actor, targetUserId, { name, roles, status, sections });
    await writeAuditLog({
      actorId: actor.id,
      action: 'admin.user.update',
      entityType: 'User',
      entityId: targetUserId,
      summary: `Updated team member ${targetUserId}`,
      metadata: { roles, status },
    });
    revalidatePath('/admin/users');
    return { status: 'success', message: 'Team member updated.' };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message, fieldErrors: error.fieldErrors };
    }
    return toActionFailure(error, 'Failed to update the team member.');
  }
}

export async function resetUserPasswordAction(
  previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void previous;
  try {
    await assertSameOrigin();
    const actor = await requireActor();
    const targetUserId = String(formData.get('id') ?? '');
    const { temporaryPassword } = await resetUserPasswordForAdmin(actor, targetUserId);
    await writeAuditLog({
      actorId: actor.id,
      action: 'admin.user.password_reset',
      entityType: 'User',
      entityId: targetUserId,
      summary: `Issued a password reset for team member ${targetUserId}`,
    });
    revalidatePath('/admin/users');
    return {
      status: 'success',
      message: temporaryPassword
        ? `Password reset. Temporary password: ${temporaryPassword} — share it securely.`
        : 'Password reset.',
    };
  } catch (error) {
    if (isAppError(error)) {
      return { status: 'error', message: error.message };
    }
    return toActionFailure(error, 'Failed to issue the password reset.');
  }
}
