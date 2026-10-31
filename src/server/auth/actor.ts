import 'server-only';
import { cache } from 'react';
import type { Role } from '@prisma/client';
import { AuthenticationError, ForbiddenError } from '@/lib/errors';
import {
  canAccessSection,
  canPublishInSection,
  hasPermission,
  isSuperAdmin,
  type Permission,
} from '@/lib/permissions';
import { readSession } from './session';

export interface Actor {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  sections: Array<{ sectionId: string; canPublish: boolean }>;
  mustChangePassword: boolean;
  sessionId: string;
}

export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await readSession();
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles: session.user.roles,
    sections: session.user.sections,
    mustChangePassword: session.user.mustChangePassword,
    sessionId: session.sessionId,
  };
});

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new AuthenticationError();
  return actor;
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (!hasPermission(actor, permission)) {
    throw new ForbiddenError('You do not have permission to perform this action.');
  }
  return actor;
}

export function assertPermission(actor: Actor, permission: Permission): void {
  if (!hasPermission(actor, permission)) {
    throw new ForbiddenError('You do not have permission to perform this action.');
  }
}

export function assertSectionAccess(
  actor: Actor,
  sectionId: string,
  permission?: Permission,
): void {
  if (permission) assertPermission(actor, permission);
  if (!canAccessSection(actor, sectionId)) {
    throw new ForbiddenError('You do not have access to this website section.');
  }
}

export function assertCanPublish(actor: Actor, sectionId: string): void {
  if (!canPublishInSection(actor, sectionId)) {
    throw new ForbiddenError('You do not have permission to publish content in this section.');
  }
}

export function assertSuperAdmin(actor: Actor): void {
  if (!isSuperAdmin(actor)) {
    throw new ForbiddenError('Only a Super Admin can perform this action.');
  }
}

export function assertCanManageUser(actor: Actor, targetUserId: string): void {
  assertSuperAdmin(actor);
  if (actor.id === targetUserId) {
    throw new ForbiddenError('You cannot change your own account through user administration.');
  }
}

export function assertPasswordChanged(actor: Actor): void {
  if (actor.mustChangePassword) {
    throw new ForbiddenError('Please change your temporary password before continuing.');
  }
}
