import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/meridian/site';

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/*/forgot-password', '/*/reset-password', '/*/search'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
