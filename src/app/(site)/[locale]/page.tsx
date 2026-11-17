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
import { HomeLabs } from '@/components/meridian/sections/home/home-labs';
import { HomePendulum } from '@/components/meridian/sections/home/home-pendulum';
import { HomeShadow } from '@/components/meridian/sections/home/home-shadow';
import { ScrollProgress } from '@/components/meridian/story/scroll-progress';

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

  // Editorial numbering runs in reading order; sections without content are skipped.
  let count = 0;
  const next = () => String((count += 1)).padStart(2, '0');

  /*
   * The homepage is one continuous story, alternating its rhythm:
   * cinematic → reading → information → pinned photography → experiment →
   * facilities → events → daylight experiment → dusk-to-night journey →
   * stories, gallery, notices and the visit.
   */
  return (
    <>
      <ScrollProgress />
      <HomeHero locale={locale} dict={dict} nextEvent={events[0] ?? null} latestNotice={notices[0] ?? null} />
      <HomeIntro locale={locale} dict={dict} index={next()} />
      <HomeGlance locale={locale} dict={dict} index={next()} />
      <HomeLabs locale={locale} dict={dict} index={next()} />
      <HomePendulum locale={locale} dict={dict} index={next()} />
      <HomeExperiences locale={locale} dict={dict} programmes={programmes} index={next()} />
      <HomeEvents
        locale={locale}
        dict={dict}
        events={events}
        externalCalendar={settings.external.upcomingEvents}
        index={next()}
      />
      <HomeShadow locale={locale} dict={dict} index={next()} />
      <HomeDiscovery locale={locale} dict={dict} index={next()} />
      {posts.length ? <HomeInsights locale={locale} dict={dict} posts={posts} index={next()} /> : null}
      {gallery.length ? <HomeGallery locale={locale} dict={dict} items={gallery} index={next()} /> : null}
      <HomeNotices locale={locale} dict={dict} notices={notices} index={next()} />
      <HomeVisit locale={locale} dict={dict} settings={settings} index={next()} />
    </>
  );
}
