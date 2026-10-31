import type { LocaleCode } from './constants';

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  external?: boolean;
}

type Translate = (key: string) => string;

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
      children: [
        { label: t('nav.about.overview'), href: `${prefix}/about` },
        { label: t('nav.about.sef'), href: `${prefix}/about/sef` },
        { label: t('nav.about.mission'), href: `${prefix}/about/mission` },
        { label: t('nav.about.rcsc'), href: `${prefix}/about/rcsc` },
        { label: t('nav.about.eminent'), href: `${prefix}/about/eminent-visitors` },
        { label: t('nav.infrastructure'), href: `${prefix}/infrastructure` },
        { label: t('nav.futurePlans'), href: `${prefix}/future-plans` },
        { label: t('nav.publications'), href: `${prefix}/publications` },
        { label: t('nav.about.links'), href: `${prefix}/about/links` },
      ],
    },
    { label: t('nav.activities'), href: `${prefix}/activities` },
    { label: t('nav.projects'), href: `${prefix}/projects` },
    { label: t('nav.gallery'), href: `${prefix}/gallery` },
    {
      label: t('nav.events'),
      href: `${prefix}/events`,
      children: [
        { label: t('nav.events'), href: `${prefix}/events` },
        { label: t('nav.notices'), href: `${prefix}/notices` },
        { label: t('nav.blog'), href: `${prefix}/blog` },
        { label: t('nav.upcomingExternal'), href: externalEventsUrl, external: true },
      ],
    },
    { label: t('nav.downloads'), href: `${prefix}/downloads` },
    { label: t('nav.contact'), href: `${prefix}/contact` },
  ];
}
