import Link from 'next/link';
import { ChevronDown, ExternalLink, Mail, MapPin, Phone, Search } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import type { Dictionary } from '@/i18n';
import type { SiteSettings } from '@/lib/site-settings';
import { buildSiteNavigation, type NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { MobileNav } from './mobile-nav';

interface SiteHeaderProps {
  locale: LocaleCode;
  dict: Dictionary;
  settings: SiteSettings;
  activePath: string;
}

function isActive(activePath: string, href: string, locale: LocaleCode): boolean {
  if (href === `/${locale}`) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

function DesktopNavItem({
  item,
  activePath,
  locale,
}: {
  item: NavItem;
  activePath: string;
  locale: LocaleCode;
}) {
  const active = isActive(activePath, item.href, locale);
  return (
    <div className="group relative">
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-2 text-[13px] font-medium tracking-[0.01em] transition-colors xl:px-3',
          active ? 'text-brass' : 'text-ink hover:text-brass',
        )}
      >
        {item.label}
        {item.children ? (
          <ChevronDown
            className="size-3 text-ink-muted transition-transform duration-300 group-hover:rotate-180"
            aria-hidden="true"
          />
        ) : null}
      </Link>
      {item.children ? (
        <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <ul className="rounded-xl border border-line/70 bg-paper/98 p-1.5 shadow-elevated backdrop-blur-md">
            {item.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  {...(child.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                    isActive(activePath, child.href, locale)
                      ? 'bg-warm-ivory text-carbon'
                      : 'text-ink-soft hover:bg-cream hover:text-carbon',
                  )}
                >
                  {child.label}
                  {child.external ? (
                    <ExternalLink className="size-3.5 shrink-0 text-brass" aria-hidden="true" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader({ locale, dict, settings, activePath }: SiteHeaderProps) {
  const navigation = buildSiteNavigation(locale, (key) => dict[key as keyof Dictionary] ?? key, settings.external.upcomingEvents);

  return (
    <header className="relative z-40">
      <div className="bg-carbon text-warm-ivory">
        <div className="site-container flex h-10 items-center justify-between gap-4 text-[11.5px]">
          <div className="flex min-w-0 items-center gap-5">
            <span className="hidden items-center gap-1.5 text-warm-ivory/55 xl:flex">
              <MapPin className="size-3.5 text-brass" aria-hidden="true" />
              <span className="truncate">{settings.contact.address}</span>
            </span>
            <a
              href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
              className="flex items-center gap-1.5 text-warm-ivory/70 transition-colors hover:text-warm-ivory"
            >
              <Phone className="size-3.5 text-brass" aria-hidden="true" />
              {settings.contact.phone}
            </a>
            <a
              href={`mailto:${settings.contact.email}`}
              className="hidden items-center gap-1.5 text-warm-ivory/70 transition-colors hover:text-warm-ivory sm:flex"
            >
              <Mail className="size-3.5 text-brass" aria-hidden="true" />
              {settings.contact.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={settings.external.upcomingEvents}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 text-warm-ivory/60 transition-colors hover:text-warm-ivory md:flex"
            >
              {dict['nav.upcomingExternal']}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            <LanguageSwitcher
              currentLocale={locale}
              label={dict['common.language']}
              light
            />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 border-b border-line/60 bg-paper/92 backdrop-blur-md">
        <div className="site-container flex h-[4.75rem] items-center justify-between gap-4">
          <Logo
            locale={locale}
            shortName={dict['site.shortName']}
            fullName={dict['site.name']}
            className="shrink-0"
          />

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label={dict['nav.main']}
          >
            {navigation.map((item) => (
              <DesktopNavItem
                key={item.href}
                item={item}
                activePath={activePath}
                locale={locale}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/search`}
              className="hidden size-9 place-items-center rounded-full border border-line text-ink-muted transition-all duration-300 hover:border-brass hover:text-brass sm:grid"
              aria-label={dict['nav.search']}
            >
              <Search className="size-4" aria-hidden="true" />
            </Link>
            <MobileNav
              items={navigation}
              locale={locale}
              labels={{
                open: dict['nav.openMenu'],
                close: dict['nav.closeMenu'],
                menu: dict['common.menu'],
                search: dict['nav.search'],
                language: dict['common.language'],
                admin: dict['nav.admin'],
              }}
              adminHref="/admin"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
