import 'server-only';
import { db } from '@/lib/db';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';
import type { ContentStatus } from '@prisma/client';
import { slugify } from '@/lib/utils';
import { localeToPrismaLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { assertPermission, assertSectionAccess, type Actor } from '@/server/auth/actor';
import { writeAuditLog } from './audit';

export interface GalleryTranslationInput {
  locale: string;
  title: string;
  description?: string | null;
}

export interface GalleryAlbumInput {
  slug?: string;
  sectionId: string;
  eventDate?: Date | null;
  coverKey?: string | null;
  sortOrder?: number;
  itemIds?: string[];
  captions?: Array<{ mediaId: string; caption?: string; altText?: string }>;
  translations: GalleryTranslationInput[];
  intent: 'save' | 'publish' | 'unpublish';
}

function nextStatus(
  actor: Actor,
  sectionId: string,
  intent: GalleryAlbumInput['intent'],
  current: ContentStatus,
): ContentStatus {
  if (intent === 'publish') {
    assertSectionAccess(actor, sectionId);
    if (!hasPermission(actor, 'gallery.manage') && !(isSuperAdmin(actor) || actor.sections.some((section) => section.sectionId === sectionId && section.canPublish))) {
      throw new ForbiddenError('You need publish rights in this section to publish albums.');
    }
    return 'PUBLISHED';
  }
  if (intent === 'unpublish') return 'DRAFT';
  return current === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
}

function assertGalleryAccess(actor: Actor, sectionId: string): void {
  if (!isSuperAdmin(actor) && !actor.sections.some((section) => section.sectionId === sectionId)) {
    throw new ForbiddenError('This album belongs to a section outside your access.');
  }
}

export async function listAlbumsForAdmin(actor: Actor) {
  assertPermission(actor, 'gallery.view');
  const albums = await db.galleryAlbum.findMany({
    where: isSuperAdmin(actor)
      ? {}
      : { sectionId: { in: actor.sections.map((section) => section.sectionId) } },
    include: {
      translations: true,
      items: { include: { media: { select: { id: true, storageKey: true, kind: true } } }, orderBy: { sortOrder: 'asc' } },
      section: { select: { id: true, nameEn: true } },
    },
    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
  return albums;
}

export async function createAlbum(actor: Actor, input: GalleryAlbumInput) {
  assertPermission(actor, 'gallery.manage');
  assertSectionAccess(actor, input.sectionId);
  const translations = normalizeAlbumTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Give the album a title in at least one language.');
  }
  const status = input.intent === 'publish' ? 'PUBLISHED' : 'DRAFT';
  const slug = await resolveAlbumSlug(input.slug, translations);

  const album = await db.galleryAlbum.create({
    data: {
      slug,
      sectionId: input.sectionId,
      status,
      eventDate: input.eventDate ?? null,
      coverKey: input.coverKey?.trim() ? input.coverKey.trim() : null,
      sortOrder: input.sortOrder ?? 0,
      translations: {
        create: translations.map((translation) => ({
          locale: localeToPrismaLocale(translation.locale as LocaleCode),
          title: translation.title,
          description: translation.description ?? null,
        })),
      },
      items: {
        create: buildItems(input),
      },
    },
    include: { translations: true, items: true },
  });
  await writeAuditLog({
    actorId: actor.id,
    action: 'gallery.album.create',
    entityType: 'GalleryAlbum',
    entityId: album.id,
    summary: `Created album ${album.slug} (${album.status})`,
    metadata: { itemCount: album.items.length },
  });
  return album;
}

export async function updateAlbum(actor: Actor, albumId: string, input: GalleryAlbumInput, expectedUpdatedAt?: string) {
  assertPermission(actor, 'gallery.manage');
  const existing = await db.galleryAlbum.findUnique({
    where: { id: albumId },
    include: { translations: true, items: true },
  });
  if (!existing) throw new NotFoundError('Album not found.');
  assertGalleryAccess(actor, existing.sectionId);
  if (existing.status === 'PUBLISHED' && input.intent !== 'publish' && !canPublishAlbum(actor, existing.sectionId)) {
    throw new ForbiddenError('Published albums can only be edited by staff with publishing rights.');
  }
  if (expectedUpdatedAt) {
    const expected = new Date(expectedUpdatedAt);
    if (Number.isFinite(expected.getTime()) && existing.updatedAt.getTime() !== expected.getTime()) {
      throw new ConflictError('This album was edited by someone else. Refresh and try again.');
    }
  }

  const translations = normalizeAlbumTranslations(input.translations);
  if (translations.length === 0) {
    throw new ValidationError('Give the album a title in at least one language.');
  }
  const status = nextStatus(actor, input.sectionId, input.intent, existing.status);
  const slug = input.slug?.trim() ? await resolveAlbumSlug(input.slug, translations, existing.id) : existing.slug;

  const album = await db.$transaction(async (transaction) => {
    const updated = await transaction.galleryAlbum.update({
      where: { id: albumId },
      data: {
        slug,
        sectionId: input.sectionId,
        status,
        eventDate: input.eventDate ?? null,
        coverKey: input.coverKey?.trim() ? input.coverKey.trim() : null,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        translations: {
          deleteMany: { albumId },
          create: translations.map((translation) => ({
            locale: localeToPrismaLocale(translation.locale as LocaleCode),
            title: translation.title,
            description: translation.description ?? null,
          })),
        },
        items: {
          deleteMany: { albumId },
          create: buildItems(input),
        },
      },
      include: { translations: true, items: true },
    });
    return updated;
  });

  await writeAuditLog({
    actorId: actor.id,
    action: input.intent === 'publish' ? 'gallery.album.publish' : 'gallery.album.update',
    entityType: 'GalleryAlbum',
    entityId: album.id,
    summary: `Updated album ${album.slug}`,
    metadata: { status: album.status, itemCount: album.items.length },
  });
  return album;
}

export async function archiveAlbum(actor: Actor, albumId: string): Promise<void> {
  assertPermission(actor, 'gallery.manage');
  const existing = await db.galleryAlbum.findUnique({ where: { id: albumId } });
  if (!existing) throw new NotFoundError('Album not found.');
  assertGalleryAccess(actor, existing.sectionId);
  await db.galleryAlbum.update({ where: { id: albumId }, data: { status: 'ARCHIVED' } });
  await writeAuditLog({
    actorId: actor.id,
    action: 'gallery.album.archive',
    entityType: 'GalleryAlbum',
    entityId: albumId,
    summary: `Archived album ${existing.slug}`,
  });
}

export async function deleteGalleryItem(actor: Actor, itemId: string): Promise<void> {
  assertPermission(actor, 'gallery.manage');
  const item = await db.galleryItem.findUnique({ where: { id: itemId }, include: { album: true } });
  if (!item) throw new NotFoundError('Gallery item not found.');
  assertGalleryAccess(actor, item.album.sectionId);
  await db.galleryItem.delete({ where: { id: itemId } });
  await writeAuditLog({
    actorId: actor.id,
    action: 'gallery.item.delete',
    entityType: 'GalleryItem',
    entityId: itemId,
    summary: `Removed item from album ${item.album.slug}`,
  });
}

function buildItems(input: GalleryAlbumInput): Array<{
  mediaId: string;
  caption: string | null;
  altText: string | null;
  sortOrder: number;
}> {
  const ids = (input.itemIds ?? []).filter((id) => id.trim().length > 0).slice(0, 200);
  if (ids.length === 0) return [];
  const captionMap = new Map((input.captions ?? []).map((entry) => [entry.mediaId, entry]));
  return ids.map((mediaId, index) => {
    const entry = captionMap.get(mediaId);
    return {
      mediaId,
      caption: entry?.caption?.trim().slice(0, 500) || null,
      altText: entry?.altText?.trim().slice(0, 300) || null,
      sortOrder: index,
    };
  });
}

function normalizeAlbumTranslations(input: GalleryTranslationInput[]) {
  const seen = new Set<string>();
  const result: Array<{ locale: string; title: string; description: string | null }> = [];
  for (const translation of input) {
    const locale = translation.locale || 'en';
    if (seen.has(locale)) continue;
    seen.add(locale);
    const title = translation.title.trim();
    if (!title) continue;
    result.push({
      locale,
      title: title.slice(0, 250),
      description: translation.description?.trim().slice(0, 1200) || null,
    });
  }
  return result;
}

async function resolveAlbumSlug(input: string | undefined, translations: GalleryTranslationInput[], albumId?: string): Promise<string> {
  const base = slugify(input?.trim() || translations.find((translation) => translation.locale === 'en')?.title || 'album');
  if (!base) throw new ValidationError('Could not create a web address from the album title.');
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const clash = await db.galleryAlbum.findFirst({
      where: { slug: candidate, ...(albumId ? { id: { not: albumId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function canPublishAlbum(actor: Actor, sectionId: string): boolean {
  return isSuperAdmin(actor) || actor.sections.some((section) => section.sectionId === sectionId && section.canPublish);
}
