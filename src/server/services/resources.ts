import 'server-only';
import { db } from '@/lib/db';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { isSuperAdmin } from '@/lib/permissions';
import { assertPermission, assertSectionAccess, type Actor } from '@/server/auth/actor';
import { writeAuditLog } from './audit';

export interface ResourceInput {
  sectionId: string;
  title: string;
  description?: string | null;
  url: string;
  category?: string | null;
  isExternal?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}

function validateUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      throw new Error('bad protocol');
    }
  } catch {
    throw new ValidationError('Please provide a valid URL starting with https://');
  }
}

export async function listResourcesForAdmin(actor: Actor) {
  assertPermission(actor, 'resource.view');
  const sections = isSuperAdmin(actor) ? undefined : actor.sections.map((item) => item.sectionId);
  if (sections && sections.length === 0) return [];
  return db.resourceLink.findMany({
    where: sections ? { sectionId: { in: sections } } : {},
    include: { section: { select: { id: true, nameEn: true } } },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
  });
}

export async function createResourceLink(actor: Actor, input: ResourceInput) {
  assertPermission(actor, 'resource.manage');
  assertSectionAccess(actor, input.sectionId);
  const title = input.title.trim();
  if (!title) throw new ValidationError('Please provide a title.');
  validateUrl(input.url.trim());

  const resource = await db.resourceLink.create({
    data: {
      sectionId: input.sectionId,
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 600) || null,
      url: input.url.trim().slice(0, 1000),
      category: input.category?.trim().slice(0, 80) || null,
      isExternal: input.isExternal ?? true,
      isPublished: input.isPublished ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'resource.create',
    entityType: 'ResourceLink',
    entityId: resource.id,
    summary: `Created resource link ${resource.title}`,
  });
  return resource;
}

export async function updateResourceLink(actor: Actor, resourceId: string, input: ResourceInput) {
  assertPermission(actor, 'resource.manage');
  const existing = await db.resourceLink.findUnique({ where: { id: resourceId } });
  if (!existing) throw new NotFoundError('Resource not found.');
  assertSectionAccess(actor, existing.sectionId);
  if (input.sectionId !== existing.sectionId) assertSectionAccess(actor, input.sectionId);
  const title = input.title.trim();
  if (!title) throw new ValidationError('Please provide a title.');
  validateUrl(input.url.trim());

  const resource = await db.resourceLink.update({
    where: { id: resourceId },
    data: {
      sectionId: input.sectionId,
      title: title.slice(0, 200),
      description: input.description?.trim().slice(0, 600) || null,
      url: input.url.trim().slice(0, 1000),
      category: input.category?.trim().slice(0, 80) || null,
      isExternal: input.isExternal ?? existing.isExternal,
      isPublished: input.isPublished ?? existing.isPublished,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'resource.update',
    entityType: 'ResourceLink',
    entityId: resource.id,
    summary: `Updated resource link ${resource.title}`,
  });
  return resource;
}

export async function archiveResourceLink(actor: Actor, resourceId: string): Promise<void> {
  assertPermission(actor, 'resource.manage');
  const existing = await db.resourceLink.findUnique({ where: { id: resourceId } });
  if (!existing) throw new NotFoundError('Resource not found.');
  assertSectionAccess(actor, existing.sectionId);
  if (!isSuperAdmin(actor) && !actor.sections.some((section) => section.canPublish && section.sectionId === existing.sectionId)) {
    throw new ForbiddenError('You need publish rights in this section to archive resources.');
  }
  await db.resourceLink.delete({ where: { id: resourceId } });
  await writeAuditLog({
    actorId: actor.id,
    action: 'resource.archive',
    entityType: 'ResourceLink',
    entityId: resourceId,
    summary: `Deleted resource link ${existing.title}`,
  });
}
