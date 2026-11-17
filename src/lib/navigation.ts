import type { LocaleCode } from './constants';

export interface NavItem {
  label: string;
  href: string;
  /** One-line description shown in the mega-menu. */
  description?: string;
  children?: NavItem[];
  external?: boolean;
  /** Mega-menu panel introduction (top-level groups only). */
  intro?: string;
  /** Key of a curated institutional photograph for the panel (BRAND_PHOTOS). */
  image?: 'centreFacade' | 'physicsLab' | 'amphitheatreNight';
  imageCaption?: string;
}

type Translate = (key: string) => string;

/**
 * Public navigation. Every link resolves to an existing route; the CMS page
 * "about/eminent-visitors" does not exist, so it is not linked.
 */
export function buildSiteNavigation(
  locale: LocaleCode,
  t: Translate,
  externalEventsUrl: string,
): NavItem[] {
  const prefix = `/${locale}`;
  return [
    { label: t('nav.home'), href: prefix },
    {
      label: t('nav.about'),
      href: `${prefix}/about`,
      intro: t('mx.nav.aboutIntro'),
      image: 'centreFacade',
      imageCaption: t('mx.home.visitCaption'),
      children: [
        { label: t('nav.about.overview'), href: `${prefix}/about`, description: t('mx.nav.d.overview') },
        { label: t('nav.about.rcsc'), href: `${prefix}/about/rcsc`, description: t('mx.nav.d.history') },
        { label: t('nav.about.sef'), href: `${prefix}/about/sef`, description: t('mx.nav.d.sef') },
        { label: t('nav.about.mission'), href: `${prefix}/about/mission`, description: t('mx.nav.d.mission') },
        { label: t('nav.futurePlans'), href: `${prefix}/future-plans`, description: t('mx.nav.d.futurePlans') },
        { label: t('nav.publications'), href: `${prefix}/publications`, description: t('mx.nav.d.publications') },
        { label: t('nav.downloads'), href: `${prefix}/downloads`, description: t('mx.nav.d.downloads') },
        { label: t('nav.about.links'), href: `${prefix}/about/links`, description: t('mx.nav.d.links') },
      ],
    },
    {
      label: t('mx.nav.exploreGroup'),
      href: `${prefix}/infrastructure`,
      intro: t('mx.nav.exploreIntro'),
      image: 'physicsLab',
      imageCaption: t('mx.story.labs.physics'),
      children: [
        { label: t('mx.nav.labs'), href: `${prefix}/infrastructure`, description: t('mx.nav.d.labs') },
        { label: t('nav.projects'), href: `${prefix}/projects`, description: t('mx.nav.d.projects') },
        { label: t('nav.activities'), href: `${prefix}/activities`, description: t('mx.nav.d.activities') },
        {
          label: t('mx.nav.astronomy'),
          href: `${prefix}/projects/big-bang-astronomy-club`,
          description: t('mx.nav.d.astronomy'),
        },
      ],
    },
    {
      label: t('mx.nav.eventsGroup'),
      href: `${prefix}/events`,
      intro: t('mx.nav.eventsIntro'),
      image: 'amphitheatreNight',
      imageCaption: t('mx.home.facility.auditorium.title'),
      children: [
        { label: t('nav.events'), href: `${prefix}/events`, description: t('mx.nav.d.events') },
        { label: t('nav.notices'), href: `${prefix}/notices`, description: t('mx.nav.d.notices') },
        { label: t('nav.blog'), href: `${prefix}/blog`, description: t('mx.nav.d.blog') },
        {
          label: t('nav.upcomingExternal'),
          href: externalEventsUrl,
          external: true,
          description: t('mx.nav.d.upcoming'),
        },
      ],
    },
    { label: t('nav.gallery'), href: `${prefix}/gallery` },
    { label: t('mx.nav.visitPage'), href: `${prefix}/visit` },
    { label: t('nav.contact'), href: `${prefix}/contact` },
  ];
}
