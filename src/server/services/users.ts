import 'server-only';
import type { Role, UserStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { isSuperAdmin } from '@/lib/permissions';
import { generateToken, sha256 } from '@/server/auth/crypto';
import {
  generateTemporaryPassword,
  hashPassword,
  validatePasswordPolicy,
  verifyPassword,
} from '@/server/auth/password';
import { revokeAllSessionsForUser } from '@/server/auth/session';
import type { Actor } from '@/server/auth/actor';
import { sendPasswordResetEmail } from '@/server/notifications/email';
import { writeAuditLog } from './audit';

const RESET_TOKEN_MINUTES = 60;

export async function authenticateUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalized },
    include: { roles: true, sections: true },
  });
  if (!user || user.status !== 'ACTIVE') return null;
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return null;
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function requestPasswordReset(email: string): Promise<{ resetUrl: string | null }> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  if (!user || user.status !== 'ACTIVE') return { resetUrl: null };

  const rawToken = generateToken(32);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.passwordResetToken.create({
      data: {
        tokenHash: sha256(rawToken),
        userId: user.id,
        expiresAt,
      },
    }),
  ]);

  const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${appUrl}/en/reset-password?token=${encodeURIComponent(rawToken)}`;
  const sent = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  if (!sent && process.env.NODE_ENV !== 'production') {
    console.info(`[auth] Development password reset link for ${user.email}: ${resetUrl}`);
  }

  return { resetUrl: process.env.NODE_ENV === 'production' ? null : resetUrl };
}

export async function resetPasswordWithToken(rawToken: string, password: string): Promise<void> {
  const policy = validatePasswordPolicy(password);
  if (!policy.valid) throw new ValidationError(policy.message ?? 'Password does not meet requirements.');

  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
    include: { user: true },
  });
  if (!token || token.usedAt || token.expiresAt <= new Date() || token.user.status !== 'ACTIVE') {
    throw new ValidationError(
      'This password reset link is invalid or has expired. Please request a new link.',
    );
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({
      where: { id: token.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    db.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);
  await revokeAllSessionsForUser(token.userId);
  await writeAuditLog({
    actorId: token.userId,
    action: 'auth.password-reset',
    entityType: 'User',
    entityId: token.userId,
    summary: 'Password reset using an emailed reset link',
  });
}

export async function changeOwnPassword(
  actor: Actor,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const policy = validatePasswordPolicy(nextPassword);
  if (!policy.valid) throw new ValidationError(policy.message ?? 'Password does not meet requirements.');
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user) throw new NotFoundError('Account not found.');
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new ValidationError('The current password is incorrect.', {
      currentPassword: 'The current password is incorrect.',
    });
  }
  const passwordHash = await hashPassword(nextPassword);
  await db.user.update({
    where: { id: actor.id },
    data: { passwordHash, mustChangePassword: false },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'auth.password-change',
    entityType: 'User',
    entityId: actor.id,
    summary: 'Changed own password',
  });
}

export async function listUsersForAdmin(actor: Actor) {
  if (!isSuperAdmin(actor)) {
    throw new ForbiddenError('Only a Super Admin can manage users.');
  }
  return db.user.findMany({
    include: {
      roles: true,
      sections: { include: { section: { select: { id: true, key: true, nameEn: true } } } },
      _count: { select: { sessions: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listSections() {
  return db.section.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }] });
}

async function assertNotLastSuperAdmin(targetUserId: string, removeSuperAdmin: boolean): Promise<void> {
  if (!removeSuperAdmin) return;
  const target = await db.user.findUnique({
    where: { id: targetUserId },
    include: { roles: true },
  });
  if (!target?.roles.some((role) => role.role === 'SUPER_ADMIN')) return;
  const superAdminCount = await db.userRole.count({
    where: { role: 'SUPER_ADMIN', user: { status: 'ACTIVE' } },
  });
  if (superAdminCount <= 1) {
    throw new ConflictError('At least one active Super Admin is required.');
  }
}

export interface CreateUserInput {
  name: string;
  email: string;
  roles: Role[];
  sections: Array<{ sectionId: string; canPublish: boolean }>;
  temporaryPassword?: string;
}

export async function createUserForAdmin(actor: Actor, input: CreateUserInput) {
  if (!isSuperAdmin(actor)) {
    throw new ForbiddenError('Only a Super Admin can create users.');
  }
  if (input.roles.length === 0) throw new ValidationError('Choose at least one role.');
  const email = input.email.trim().toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new ConflictError('A user with this email address already exists.');

  const temporaryPassword =
    input.temporaryPassword ?? generateTemporaryPassword();
  if (input.temporaryPassword) {
    const policy = validatePasswordPolicy(input.temporaryPassword);
    if (!policy.valid) {
      throw new ValidationError(
        policy.message ?? 'Temporary password does not meet requirements.',
        { temporaryPassword: policy.message ?? 'Temporary password does not meet requirements.' },
      );
    }
  }
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await db.user.create({
    data: {
      name: input.name.trim().slice(0, 160),
      email,
      passwordHash,
      mustChangePassword: true,
      roles: { create: input.roles.map((role) => ({ role })) },
sections: {
        create: input.sections
          .filter((section) => input.roles.some((role) => role !== 'SUPER_ADMIN')) // eslint-disable-line @typescript-eslint/no-unused-vars
          .map((section) => ({
            sectionId: section.sectionId,
            canPublish: section.canPublish,
          })),
      },
    },
    include: { roles: true, sections: true },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'user.create',
    entityType: 'User',
    entityId: user.id,
    summary: `Created ${user.email} with roles ${input.roles.join(', ')}`,
  });
  return { user, temporaryPassword };
}

export async function updateUserForAdmin(
  actor: Actor,
  targetUserId: string,
  input: {
    name: string;
    roles: Role[];
    status: UserStatus;
    sections: Array<{ sectionId: string; canPublish: boolean }>;
  },
) {
  if (!isSuperAdmin(actor)) {
    throw new ForbiddenError('Only a Super Admin can manage users.');
  }
  if (actor.id === targetUserId) {
    throw new ConflictError('Use the account page to change your own profile.');
  }
  if (input.roles.length === 0) throw new ValidationError('Choose at least one role.');

  await assertNotLastSuperAdmin(
    targetUserId,
    !input.roles.includes('SUPER_ADMIN') || input.status !== 'ACTIVE',
  );

  const user = await db.$transaction(async (transaction) => {
    await transaction.userRole.deleteMany({ where: { userId: targetUserId } });
    await transaction.userSection.deleteMany({ where: { userId: targetUserId } });
    return transaction.user.update({
      where: { id: targetUserId },
      data: {
        name: input.name.trim().slice(0, 160),
        status: input.status,
        roles: { create: input.roles.map((role) => ({ role })) },
        sections: {
          create: input.roles.includes('SUPER_ADMIN')
            ? []
            : input.sections.map((section) => ({
                sectionId: section.sectionId,
                canPublish: section.canPublish,
              })),
        },
      },
      include: { roles: true, sections: true },
    });
  });

  if (input.status === 'DISABLED') {
    await revokeAllSessionsForUser(targetUserId);
  }
  await writeAuditLog({
    actorId: actor.id,
    action: 'user.update',
    entityType: 'User',
    entityId: targetUserId,
    summary: `Updated ${user.email}; status ${input.status}; roles ${input.roles.join(', ')}`,
  });
  return user;
}

export async function resetUserPasswordForAdmin(actor: Actor, targetUserId: string) {
  if (!isSuperAdmin(actor)) {
    throw new ForbiddenError('Only a Super Admin can reset passwords.');
  }
  if (actor.id === targetUserId) {
    throw new ConflictError('Use the account page to change your own password.');
  }
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new NotFoundError('User not found.');
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await db.user.update({
    where: { id: targetUserId },
    data: { passwordHash, mustChangePassword: true },
  });
  await revokeAllSessionsForUser(targetUserId);
  await writeAuditLog({
    actorId: actor.id,
    action: 'user.password-reset',
    entityType: 'User',
    entityId: targetUserId,
    summary: `Reset password for ${target.email}`,
  });
  return { temporaryPassword };
}
