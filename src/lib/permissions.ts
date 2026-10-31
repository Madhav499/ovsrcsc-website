import type { Role } from '@prisma/client';

export const PERMISSIONS = [
  'dashboard.view',
  'admin.users',
  'admin.roles',
  'admin.audit',
  'admin.settings',
  'sections.manage',
  'page.view',
  'page.create',
  'page.edit',
  'page.publish',
  'page.delete',
  'page.restore',
  'notice.view',
  'notice.manage',
  'notice.publish',
  'event.view',
  'event.manage',
  'event.publish',
  'announcement.manage',
  'announcement.publish',
  'media.view',
  'media.upload',
  'media.manage',
  'media.delete',
  'gallery.view',
  'gallery.manage',
  'blog.view',
  'blog.manage',
  'blog.publish',
  'resource.view',
  'resource.manage',
  'enquiry.view',
  'enquiry.manage',
  'registration.view',
  'registration.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  SECTION_EDITOR: [
    'dashboard.view',
    'page.view',
    'page.create',
    'page.edit',
    'page.publish',
    'page.delete',
    'page.restore',
    'notice.view',
    'notice.manage',
    'notice.publish',
    'event.view',
    'media.view',
    'media.upload',
    'media.manage',
    'media.delete',
    'gallery.view',
    'gallery.manage',
    'blog.view',
    'blog.manage',
    'blog.publish',
    'resource.view',
    'resource.manage',
    'enquiry.view',
    'registration.view',
  ],
  CONTENT_CONTRIBUTOR: [
    'dashboard.view',
    'page.view',
    'page.create',
    'page.edit',
    'media.view',
    'media.upload',
    'gallery.view',
    'gallery.manage',
    'blog.view',
    'blog.manage',
    'resource.view',
    'resource.manage',
  ],
  EVENTS_MANAGER: [
    'dashboard.view',
    'event.view',
    'event.manage',
    'event.publish',
    'notice.view',
    'notice.manage',
    'notice.publish',
    'announcement.manage',
    'announcement.publish',
    'media.view',
    'media.upload',
    'media.manage',
    'enquiry.view',
    'registration.view',
    'registration.manage',
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  SECTION_EDITOR: 'Section Editor',
  CONTENT_CONTRIBUTOR: 'Content Contributor',
  EVENTS_MANAGER: 'Events & Announcements Manager',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN:
    'Full access to users, roles, sections, content, settings, announcements and audit logs.',
  SECTION_EDITOR:
    'Manages content only in assigned sections. Publishing additionally requires publish rights for that section.',
  CONTENT_CONTRIBUTOR:
    'Creates and edits drafts in assigned sections. Cannot publish or change site-wide settings.',
  EVENTS_MANAGER:
    'Manages assigned events, notices and scheduled announcements, including their publication and expiry dates.',
};

export interface ActorLike {
  id: string;
  roles: readonly Role[];
  sections: readonly { sectionId: string; canPublish: boolean }[];
}

export function effectivePermissions(roles: readonly Role[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      set.add(permission);
    }
  }
  return set;
}

export function isSuperAdmin(actor: ActorLike): boolean {
  return actor.roles.includes('SUPER_ADMIN');
}

export function hasPermission(actor: ActorLike, permission: Permission): boolean {
  if (isSuperAdmin(actor)) return true;
  return effectivePermissions(actor.roles).has(permission);
}

export function sectionAssignment(actor: ActorLike, sectionId: string) {
  return actor.sections.find((item) => item.sectionId === sectionId);
}

export function canAccessSection(actor: ActorLike, sectionId: string): boolean {
  if (isSuperAdmin(actor)) return true;
  return Boolean(sectionAssignment(actor, sectionId));
}

export function canPublishInSection(actor: ActorLike, sectionId: string): boolean {
  if (isSuperAdmin(actor)) return true;
  if (!hasPermission(actor, 'page.publish') && !hasPermission(actor, 'event.publish')) {
    return false;
  }
  return Boolean(sectionAssignment(actor, sectionId)?.canPublish);
}

export function allowedSectionIds(actor: ActorLike): string[] | 'all' {
  if (isSuperAdmin(actor)) return 'all';
  return actor.sections.map((item) => item.sectionId);
}
