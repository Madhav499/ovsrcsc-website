import type { MetadataRoute } from 'next';
import { LOCALES, LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { siteOrigin } from '@/lib/meridian/site';
import {
  getSitemapAlbums,
  getSitemapBlogPosts,
  getSitemapEvents,
  getSitemapNotices,
  getSitemapPages,
} from '@/server/public/queries';

export const dynamic = 'force-dynamic';

const STATIC_PATHS = ['', '/events', '/notices', '/blog', '/gallery', '/downloads', '/visit', '/contact', '/enquiries'];

function entry(
  origin: string,
  path: string,
  lastModified?: Date,
  locales: readonly LocaleCode[] = LOCALES,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[LOCALE_LABELS[locale].htmlLang] = `${origin}/${locale}${path}`;
  return locales.map((locale) => ({
    url: `${origin}/${locale}${path}`,
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const [pages, notices, events, posts, albums] = await Promise.all([
    getSitemapPages(),
    getSitemapNotices(),
    getSitemapEvents(),
    getSitemapBlogPosts(),
    getSitemapAlbums(),
  ]);

  return [
    ...STATIC_PATHS.flatMap((path) => entry(origin, path)),
    // CMS pages fall back to English, so every locale URL resolves.
    ...pages.flatMap((page) => entry(origin, `/${page.path}`, page.updatedAt)),
    ...notices.flatMap((notice) => entry(origin, `/notices/${notice.slug}`, notice.updatedAt)),
    ...events.flatMap((event) => entry(origin, `/events/${event.slug}`, event.updatedAt)),
    ...posts.flatMap((post) => entry(origin, `/blog/${post.slug}`, post.updatedAt)),
    ...albums.flatMap((album) => entry(origin, `/gallery/${album.slug}`, album.updatedAt)),
  ];
}
