import 'server-only';
import { db } from '@/lib/db';
import type { LocaleCode } from '@/lib/constants';
import { startOfInstitutionDay } from '@/lib/dates';
import { isAnnouncementActive } from '@/lib/announcement';
import { localizePath } from '@/i18n';
import {
  contentExcerpt,
  getPublishedTranslation,
  isFallbackTranslation,
} from './content';

export interface PublicNotice {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  linkUrl: string | null;
  linkLabel: string | null;
  isPinned: boolean;
  publishAt: Date | null;
  expireAt: Date | null;
  isFallback: boolean;
  attachments: Array<{
    id: string;
    title: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  }>;
  sectionName: string;
}

function sectionName(
  section: { nameEn: string; nameGu: string; nameHi: string },
  locale: LocaleCode,
): string {
  if (locale === 'gu') return section.nameGu || section.nameEn;
  if (locale === 'hi') return section.nameHi || section.nameEn;
  return section.nameEn;
}

export async function getActiveNotices(locale: LocaleCode, limit = 6): Promise<PublicNotice[]> {
  const now = new Date();
  const notices = await db.notice.findMany({
    where: {
      status: 'PUBLISHED',
      AND: [
        { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
        { OR: [{ expireAt: null }, { expireAt: { gt: now } }] },
      ],
      translations: { some: {} },
    },
    include: {
      translations: true,
      section: true,
      attachments: { include: { media: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  return notices
    .map((notice) => {
      const translation = getPublishedTranslation(notice.translations, locale);
      if (!translation) return null;
      return {
        id: notice.id,
        slug: notice.slug,
        title: translation.title,
        bodyHtml: translation.bodyHtml,
        linkUrl: translation.linkUrl,
        linkLabel: translation.linkLabel,
        isPinned: notice.isPinned,
        publishAt: notice.publishAt,
        expireAt: notice.expireAt,
        isFallback: isFallbackTranslation(translation, locale),
        attachments: notice.attachments
          .filter((attachment) => attachment.media.isPublic && !attachment.media.archivedAt)
          .map((attachment) => ({
            id: attachment.media.id,
            title: attachment.media.title,
            storageKey: attachment.media.storageKey,
            mimeType: attachment.media.mimeType,
            sizeBytes: attachment.media.sizeBytes,
            originalName: attachment.media.originalName,
          })),
        sectionName: sectionName(notice.section, locale),
      };
    })
    .filter((notice): notice is PublicNotice => notice !== null);
}

export async function getNoticeArchive(locale: LocaleCode, limit = 20): Promise<PublicNotice[]> {
  const now = new Date();
  const notices = await db.notice.findMany({
    where: {
      status: 'PUBLISHED',
      expireAt: { lte: now },
      translations: { some: {} },
    },
    include: {
      translations: true,
      section: true,
      attachments: { include: { media: true } },
    },
    orderBy: [{ expireAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return notices
    .map((notice) => {
      const translation = getPublishedTranslation(notice.translations, locale);
      if (!translation) return null;
      return {
        id: notice.id,
        slug: notice.slug,
        title: translation.title,
        bodyHtml: translation.bodyHtml,
        linkUrl: translation.linkUrl,
        linkLabel: translation.linkLabel,
        isPinned: notice.isPinned,
        publishAt: notice.publishAt,
        expireAt: notice.expireAt,
        isFallback: isFallbackTranslation(translation, locale),
        attachments: notice.attachments
          .filter((attachment) => attachment.media.isPublic && !attachment.media.archivedAt)
          .map((attachment) => ({
            id: attachment.media.id,
            title: attachment.media.title,
            storageKey: attachment.media.storageKey,
            mimeType: attachment.media.mimeType,
            sizeBytes: attachment.media.sizeBytes,
            originalName: attachment.media.originalName,
          })),
        sectionName: sectionName(notice.section, locale),
      };
    })
    .filter((notice): notice is PublicNotice => notice !== null);
}

export async function getNoticeBySlug(slug: string, locale: LocaleCode) {
  const now = new Date();
  const notice = await db.notice.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      AND: [{ OR: [{ publishAt: null }, { publishAt: { lte: now } }] }],
    },
    include: {
      translations: true,
      section: true,
      attachments: { include: { media: true } },
    },
  });
  if (!notice) return null;
  const translation = getPublishedTranslation(notice.translations, locale);
  if (!translation) return null;
  return {
    ...notice,
    translation,
    title: translation.title,
    isFallback: isFallbackTranslation(translation, locale),
    attachments: notice.attachments
      .filter((attachment) => attachment.media.isPublic && !attachment.media.archivedAt)
      .map((attachment) => ({
        id: attachment.media.id,
        title: attachment.media.title,
        storageKey: attachment.media.storageKey,
        mimeType: attachment.media.mimeType,
        sizeBytes: attachment.media.sizeBytes,
        originalName: attachment.media.originalName,
      })),
    sectionLabel: sectionName(notice.section, locale),
    excerpt: contentExcerpt(translation.bodyHtml, 180),
  };
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  location: string | null;
  coverKey: string | null;
  registrationEnabled: boolean;
  registrationDeadline: Date | null;
  capacity: number | null;
  isFallback: boolean;
  sectionName: string;
}

function mapEvent(
  event: {
    id: string;
    slug: string;
    startAt: Date;
    endAt: Date | null;
    allDay: boolean;
    location: string | null;
    coverKey: string | null;
    registrationEnabled: boolean;
    registrationDeadline: Date | null;
    capacity: number | null;
    translations: Array<{
      locale: 'EN' | 'GU' | 'HI';
      title: string;
      description: string;
      location: string | null;
    }>;
    section: { nameEn: string; nameGu: string; nameHi: string };
  },
  locale: LocaleCode,
): PublicEvent | null {
  const translation = getPublishedTranslation(event.translations, locale);
  if (!translation) return null;
  return {
    id: event.id,
    slug: event.slug,
    title: translation.title,
    description: translation.description,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    location: translation.location ?? event.location,
    coverKey: event.coverKey,
    registrationEnabled: event.registrationEnabled,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    isFallback: isFallbackTranslation(translation, locale),
    sectionName: sectionName(event.section, locale),
  };
}

export async function getUpcomingEvents(locale: LocaleCode, limit = 6): Promise<PublicEvent[]> {
  const from = startOfInstitutionDay(new Date());
  const events = await db.event.findMany({
    where: { status: 'PUBLISHED', startAt: { gte: from } },
    include: { translations: true, section: true },
    orderBy: { startAt: 'asc' },
    take: limit,
  });
  return events
    .map((event) => mapEvent(event, locale))
    .filter((event): event is PublicEvent => event !== null);
}

export async function getPastEvents(locale: LocaleCode, limit = 12): Promise<PublicEvent[]> {
  const from = startOfInstitutionDay(new Date());
  const events = await db.event.findMany({
    where: { status: 'PUBLISHED', startAt: { lt: from } },
    include: { translations: true, section: true },
    orderBy: { startAt: 'desc' },
    take: limit,
  });
  return events
    .map((event) => mapEvent(event, locale))
    .filter((event): event is PublicEvent => event !== null);
}

export async function getEventBySlug(slug: string, locale: LocaleCode) {
  const event = await db.event.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      translations: true,
      section: true,
      registrations: { select: { participants: true, status: true } },
    },
  });
  if (!event) return null;
  const mapped = mapEvent(event, locale);
  if (!mapped) return null;
  const takenSeats = event.registrations
    .filter((registration) => registration.status !== 'CANCELLED')
    .reduce((total, registration) => total + registration.participants, 0);
  return {
    ...mapped,
    sectionPath: event.section.key,
    remainingSeats:
      event.capacity === null ? null : Math.max(0, event.capacity - takenSeats),
    registrationOpen:
      event.registrationEnabled &&
      event.status === 'PUBLISHED' &&
      (!event.registrationDeadline || event.registrationDeadline.getTime() > Date.now()) &&
      (event.capacity === null || takenSeats < event.capacity),
  };
}

export async function getPublishedAlbums(locale: LocaleCode) {
  const albums = await db.galleryAlbum.findMany({
    where: { status: 'PUBLISHED', translations: { some: {} } },
    include: {
      translations: true,
      items: {
        include: { media: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return albums
    .map((album) => {
      const translation = getPublishedTranslation(album.translations, locale);
      if (!translation) return null;
      const items = album.items
        .filter((item) => item.media.isPublic && !item.media.archivedAt)
        .map((item) => ({
          id: item.id,
          mediaId: item.mediaId,
          storageKey: item.media.storageKey,
          width: item.media.width,
          height: item.media.height,
          title: item.media.title,
          altText: item.altText || item.media.altText || item.media.title,
          caption: item.caption ?? item.media.caption,
        }));
      return {
        id: album.id,
        slug: album.slug,
        title: translation.title,
        description: translation.description,
        eventDate: album.eventDate,
        coverKey: album.coverKey ?? items[0]?.storageKey ?? null,
        items,
        isFallback: isFallbackTranslation(translation, locale),
      };
    })
    .filter((album): album is NonNullable<typeof album> => album !== null);
}

export async function getAlbumBySlug(slug: string, locale: LocaleCode) {
  const albums = await getPublishedAlbums(locale);
  return albums.find((album) => album.slug === slug) ?? null;
}

export async function getGalleryHighlights(limit = 8) {
  const items = await db.galleryItem.findMany({
    where: {
      album: { status: 'PUBLISHED' },
      media: { isPublic: true, archivedAt: null, kind: 'IMAGE' },
    },
    include: { media: true, album: true },
    orderBy: [{ album: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    take: limit,
  });
  return items.map((item) => ({
    id: item.id,
    storageKey: item.media.storageKey,
    width: item.media.width,
    height: item.media.height,
    alt: item.altText || item.media.altText || item.media.title,
    caption: item.caption ?? item.media.caption,
    albumSlug: item.album.slug,
  }));
}

export async function getPublishedResourceLinks() {
  const resources = await db.resourceLink.findMany({
    where: { isPublished: true },
    include: { section: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
  });
  return resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    url: resource.url,
    category: resource.category,
    isExternal: resource.isExternal,
    sectionKey: resource.section.key,
    sectionName: resource.section.nameEn,
  }));
}

export async function getPublishedDocuments() {
  const documents = await db.mediaAsset.findMany({
    where: { kind: 'DOCUMENT', isPublic: true, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    originalName: document.originalName,
    storageKey: document.storageKey,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
  }));
}

export async function getPublishedBlogPosts(locale: LocaleCode, limit = 12) {
  const now = new Date();
  const posts = await db.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      AND: [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }],
      translations: { some: {} },
    },
    include: { translations: true, section: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
  return posts
    .map((post) => {
      const translation = getPublishedTranslation(post.translations, locale);
      if (!translation) return null;
      return {
        id: post.id,
        slug: post.slug,
        title: translation.title,
        summary: translation.summary ?? contentExcerpt(translation.bodyHtml, 180),
        coverKey: post.coverKey,
        category: post.category,
        publishedAt: post.publishedAt ?? post.createdAt,
        sectionName: sectionName(post.section, locale),
        isFallback: isFallbackTranslation(translation, locale),
      };
    })
    .filter((post): post is NonNullable<typeof post> => post !== null);
}

export async function getBlogPostBySlug(slug: string, locale: LocaleCode) {
  const post = await db.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { translations: true, section: true },
  });
  if (!post) return null;
  const translation = getPublishedTranslation(post.translations, locale);
  if (!translation) return null;
  return {
    ...post,
    translation,
    title: translation.title,
    isFallback: isFallbackTranslation(translation, locale),
    sectionLabel: sectionName(post.section, locale),
    excerpt: translation.summary ?? contentExcerpt(translation.bodyHtml, 180),
  };
}

export async function getActiveAnnouncement(locale: LocaleCode) {
  const now = new Date();
  const announcements = await db.announcement.findMany({
    where: {
      enabled: true,
      status: 'PUBLISHED',
      startAt: { lte: now },
      endAt: { gt: now },
      translations: { some: {} },
    },
    include: { translations: true },
    orderBy: { startAt: 'desc' },
    take: 5,
  });
  for (const announcement of announcements) {
    if (!isAnnouncementActive(announcement, now)) continue;
    const translation = getPublishedTranslation(announcement.translations, locale);
    if (!translation) continue;
    return {
      id: announcement.id,
      title: translation.title,
      message: translation.message,
      linkUrl: announcement.linkUrl,
      linkLabel: translation.linkLabel,
      imageKey: announcement.imageKey,
      startAt: announcement.startAt,
      endAt: announcement.endAt,
      isFallback: isFallbackTranslation(translation, locale),
    };
  }
  return null;
}

export async function getPageBreadcrumbs(
  path: string,
  locale: LocaleCode,
): Promise<Array<{ label: string; path: string }>> {
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) return [];
  const prefixes: string[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    prefixes.push(segments.slice(0, index).join('/'));
  }
  const pages = await db.page.findMany({
    where: { path: { in: prefixes }, status: 'PUBLISHED' },
    include: { translations: true },
  });
  return prefixes
    .map((prefix) => {
      const page = pages.find((item) => item.path === prefix);
      const translation = page ? getPublishedTranslation(page.translations, locale) : null;
      return translation ? { label: translation.title, path: `/${prefix}` } : null;
    })
    .filter((crumb): crumb is { label: string; path: string } => crumb !== null);
}

export async function getChildPages(pagePath: string, locale: LocaleCode) {
  const pages = await db.page.findMany({
    where: {
      status: 'PUBLISHED',
      path: { startsWith: `${pagePath}/` },
      translations: { some: { status: 'PUBLISHED' } },
    },
    include: { translations: true },
    orderBy: [{ sortOrder: 'asc' }, { path: 'asc' }],
  });
  const depth = pagePath.split('/').filter(Boolean).length;
  return pages
    .filter((page) => page.path.split('/').filter(Boolean).length === depth + 1)
    .map((page) => {
      const translation = getPublishedTranslation(page.translations, locale);
      return translation
        ? {
            id: page.id,
            path: page.path,
            title: translation.title,
            summary: translation.summary ?? contentExcerpt(translation.bodyHtml, 160),
            coverKey: page.coverKey,
          }
        : null;
    })
    .filter((page): page is NonNullable<typeof page> => page !== null);
}

export async function getRelatedPages(sectionId: string, excludeId: string, locale: LocaleCode) {
  const pages = await db.page.findMany({
    where: {
      sectionId,
      id: { not: excludeId },
      status: 'PUBLISHED',
      translations: { some: { status: 'PUBLISHED' } },
    },
    include: { translations: true },
    orderBy: [{ sortOrder: 'asc' }, { path: 'asc' }],
    take: 5,
  });
  return pages
    .map((page) => {
      const translation = getPublishedTranslation(page.translations, locale);
      return translation
        ? { id: page.id, path: page.path, title: translation.title }
        : null;
    })
    .filter((page): page is NonNullable<typeof page> => page !== null);
}

export async function getPublicSections() {
  const sections = await db.section.findMany({ orderBy: { sortOrder: 'asc' } });
  return sections;
}

export async function getSitemapPages() {
  return db.page.findMany({
    where: { status: 'PUBLISHED', translations: { some: { status: 'PUBLISHED' } } },
    select: {
      path: true,
      updatedAt: true,
      translations: { where: { status: 'PUBLISHED' }, select: { locale: true } },
    },
    orderBy: { path: 'asc' },
  });
}

export async function getSitemapNotices() {
  return db.notice.findMany({
    where: { status: 'PUBLISHED', translations: { some: {} } },
    select: { slug: true, updatedAt: true },
  });
}

export async function getSitemapEvents() {
  return db.event.findMany({
    where: { status: 'PUBLISHED', translations: { some: {} } },
    select: { slug: true, updatedAt: true },
  });
}

export async function getSitemapBlogPosts() {
  return db.blogPost.findMany({
    where: { status: 'PUBLISHED', translations: { some: {} } },
    select: { slug: true, updatedAt: true },
  });
}

export async function getSitemapAlbums() {
  return db.galleryAlbum.findMany({
    where: { status: 'PUBLISHED', translations: { some: {} } },
    select: { slug: true, updatedAt: true },
  });
}

export interface SearchResult {
  type: 'page' | 'notice' | 'event' | 'blog';
  title: string;
  summary: string;
  href: string;
  isFallback: boolean;
}

export async function searchPublicContent(
  query: string,
  locale: LocaleCode,
  limit = 20,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const contains = { contains: q, mode: 'insensitive' as const };
  const [pages, notices, events, posts] = await Promise.all([
    db.page.findMany({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: { status: 'PUBLISHED', OR: [{ title: contains }, { bodyHtml: contains }] },
        },
      },
      include: { translations: true },
      take: limit,
    }),
    db.notice.findMany({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: { OR: [{ title: contains }, { bodyHtml: contains }] },
        },
      },
      include: { translations: true },
      take: limit,
    }),
    db.event.findMany({
      where: {
        status: 'PUBLISHED',
        translations: { some: { OR: [{ title: contains }, { description: contains }] } },
      },
      include: { translations: true },
      take: limit,
    }),
    db.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: { OR: [{ title: contains }, { bodyHtml: contains }, { summary: contains }] },
        },
      },
      include: { translations: true },
      take: limit,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const page of pages) {
    const translation = getPublishedTranslation(page.translations, locale);
    if (!translation) continue;
    results.push({
      type: 'page',
      title: translation.title,
      summary: translation.summary ?? contentExcerpt(translation.bodyHtml, 160),
      href: localizePath(locale, `/${page.path}`),
      isFallback: isFallbackTranslation(translation, locale),
    });
  }
  for (const notice of notices) {
    const translation = getPublishedTranslation(notice.translations, locale);
    if (!translation) continue;
    results.push({
      type: 'notice',
      title: translation.title,
      summary: contentExcerpt(translation.bodyHtml, 160),
      href: localizePath(locale, `/notices/${notice.slug}`),
      isFallback: isFallbackTranslation(translation, locale),
    });
  }
  for (const event of events) {
    const translation = getPublishedTranslation(event.translations, locale);
    if (!translation) continue;
    results.push({
      type: 'event',
      title: translation.title,
      summary: contentExcerpt(translation.description, 160),
      href: localizePath(locale, `/events/${event.slug}`),
      isFallback: isFallbackTranslation(translation, locale),
    });
  }
  for (const post of posts) {
    const translation = getPublishedTranslation(post.translations, locale);
    if (!translation) continue;
    results.push({
      type: 'blog',
      title: translation.title,
      summary: translation.summary ?? contentExcerpt(translation.bodyHtml, 160),
      href: localizePath(locale, `/blog/${post.slug}`),
      isFallback: isFallbackTranslation(translation, locale),
    });
  }

  return results.slice(0, limit);
}
