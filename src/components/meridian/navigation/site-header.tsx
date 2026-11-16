import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import type { SiteSettings } from '@/lib/site-settings';
import { buildSiteNavigation } from '@/lib/navigation';
import { HeaderShell } from './header-shell';

interface SiteHeaderProps {
  locale: LocaleCode;
  dict: Dictionary;
  settings: SiteSettings;
}

export function SiteHeader({ locale, dict, settings }: SiteHeaderProps) {
  const t = (key: string) => dict[key as keyof Dictionary] ?? key;
  const items = buildSiteNavigation(locale, t, settings.external.upcomingEvents);

  return (
    <HeaderShell
      locale={locale}
      items={items}
      contact={{ phone: settings.contact.phone, email: settings.contact.email }}
      labels={{
        name: dict['site.shortName'],
        familiar: dict['mx.brand.familiar'],
        logoAlt: dict['mx.brand.logoAlt'],
        home: dict['mx.brand.home'],
        mainNav: dict['nav.main'],
        openMenu: dict['nav.openMenu'],
        closeMenu: dict['nav.closeMenu'],
        menu: dict['common.menu'],
        language: dict['common.language'],
        visit: dict['mx.nav.visit'],
        searchOpen: dict['mx.nav.searchOpen'],
        searchClose: dict['mx.nav.searchClose'],
        searchLabel: dict['search.prompt'],
        searchPlaceholder: dict['common.searchPlaceholder'],
        searchButton: dict['search.button'],
        explore: dict['mx.nav.explore'],
        submenu: dict['mx.nav.submenu'],
        external: dict['a11y.newTab'],
        phone: dict['common.phone'],
        email: dict['common.email'],
      }}
    />
  );
}
