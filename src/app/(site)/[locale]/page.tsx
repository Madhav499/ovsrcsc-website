import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { localeAlternates } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { getFeaturedProgrammes } from '@/server/services/pages';
import {
  getActiveNotices,
  getGalleryHighlights,
  getPublishedBlogPosts,
  getUpcomingEvents,
} from '@/server/public/queries';
import { HomeHero } from '@/components/meridian/sections/home/home-hero';
import { HomeIntro } from '@/components/meridian/sections/home/home-intro';
import { HomeGlance } from '@/components/meridian/sections/home/home-glance';
import { HomeExperiences } from '@/components/meridian/sections/home/home-experiences';
import { HomeEvents } from '@/components/meridian/sections/home/home-events';
import { HomeDiscovery } from '@/components/meridian/sections/home/home-discovery';
import { HomeInsights } from '@/components/meridian/sections/home/home-insights';
import { HomeGallery } from '@/components/meridian/sections/home/home-gallery';
import { HomeNotices } from '@/components/meridian/sections/home/home-notices';
import { HomeVisit } from '@/components/meridian/sections/home/home-visit';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    description: dict['meta.homeDescription'],
    alternates: localeAlternates(locale, ''),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);

  const [settings, notices, events, gallery, programmes, posts] = await Promise.all([
    getSiteSettings(),
    getActiveNotices(locale, 4),
    getUpcomingEvents(locale, 4),
    getGalleryHighlights(7),
    getFeaturedProgrammes(locale),
    getPublishedBlogPosts(locale, 4),
  ]);

  return (
    <>
      <HomeHero locale={locale} dict={dict} nextEvent={events[0] ?? null} latestNotice={notices[0] ?? null} />
      <HomeIntro locale={locale} dict={dict} />
      <HomeGlance locale={locale} dict={dict} />
      <HomeExperiences locale={locale} dict={dict} programmes={programmes} />
      <HomeEvents locale={locale} dict={dict} events={events} externalCalendar={settings.external.upcomingEvents} />
      <HomeDiscovery locale={locale} dict={dict} />
      <HomeInsights locale={locale} dict={dict} posts={posts} />
      <HomeGallery locale={locale} dict={dict} items={gallery} />
      <HomeNotices locale={locale} dict={dict} notices={notices} />
      <HomeVisit locale={locale} dict={dict} settings={settings} />
    </>
  );
}
