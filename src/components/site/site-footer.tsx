import Link from 'next/link';
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import type { Dictionary } from '@/i18n';
import type { SiteSettings } from '@/lib/site-settings';

interface SiteFooterProps {
  locale: LocaleCode;
  dict: Dictionary;
  settings: SiteSettings;
}

export function SiteFooter({ locale, dict, settings }: SiteFooterProps) {
  const prefix = `/${locale}`;
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: dict['nav.about'], href: `${prefix}/about` },
    { label: dict['nav.activities'], href: `${prefix}/activities` },
    { label: dict['nav.projects'], href: `${prefix}/projects` },
    { label: dict['nav.gallery'], href: `${prefix}/gallery` },
    { label: dict['nav.events'], href: `${prefix}/events` },
    { label: dict['nav.notices'], href: `${prefix}/notices` },
    { label: dict['nav.blog'], href: `${prefix}/blog` },
    { label: dict['nav.contact'], href: `${prefix}/contact` },
  ];

  const programmeLinks = [
    { label: dict['home.flagship.sss'], href: `${prefix}/projects/sunday-science-school` },
    { label: dict['home.flagship.safar'], href: `${prefix}/projects/vigyan-safar` },
    { label: dict['home.flagship.darshan'], href: `${prefix}/projects/vigyan-darshan` },
    { label: dict['nav.publications'], href: `${prefix}/publications` },
    { label: dict['nav.downloads'], href: `${prefix}/downloads` },
  ];

  const socials = [
    { label: 'Facebook', href: settings.socials.facebook, Icon: Facebook },
    { label: 'X / Twitter', href: settings.socials.twitter, Icon: Twitter },
    { label: 'YouTube', href: settings.socials.youtube, Icon: Youtube },
    { label: 'Instagram', href: settings.socials.instagram, Icon: Instagram },
  ].filter((social) => Boolean(social.href));

  return (
    <footer className="relative mt-24 overflow-hidden bg-carbon text-warm-ivory">
      <div
        className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full border border-warm-ivory/8"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -top-24 size-[20rem] rounded-full border border-warm-ivory/8"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-2 top-2 size-2 rounded-full bg-brass"
        aria-hidden="true"
      />

      <div className="site-container relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.8fr_1fr_1.15fr]">
          <div>
            <p className="font-display text-3.5xl font-medium leading-[1.1] tracking-[-0.03em] text-warm-ivory lg:text-4xl">
              {dict['site.tagline']}
              <span className="text-brass">.</span>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-warm-ivory/55">
              {dict['footer.about']}
            </p>
            <p className="mt-6 max-w-sm text-xs leading-relaxed text-warm-ivory/35">
              {dict['footer.parent']}
            </p>
          </div>

          <div>
            <h2 className="section-label text-warm-ivory/40">
              {dict['footer.quickLinks']}
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-warm-ivory/60 transition-colors duration-300 hover:text-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="section-label text-warm-ivory/40">
              {dict['footer.programmes']}
            </h2>
            <ul className="mt-5 space-y-2.5 text-sm">
              {programmeLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-warm-ivory/60 transition-colors duration-300 hover:text-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="section-label text-warm-ivory/40">
              {dict['footer.connect']}
            </h2>
            <address className="mt-5 space-y-3 text-sm not-italic text-warm-ivory/60">
              <p className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" />
                <span>
                  {settings.contact.address}
                  <a
                    href={settings.contact.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-warm-ivory/40 hover:text-brass"
                  >
                    {dict['home.visit.map']}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </a>
                </span>
              </p>
              <p>
                <a
                  href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
                  className="flex items-center gap-2.5 hover:text-brass"
                >
                  <Phone className="size-4 shrink-0 text-brass" aria-hidden="true" />
                  {settings.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${settings.contact.email}`}
                  className="flex items-center gap-2.5 break-all hover:text-brass"
                >
                  <Mail className="size-4 shrink-0 text-brass" aria-hidden="true" />
                  {settings.contact.email}
                </a>
              </p>
            </address>

            {socials.length > 0 ? (
              <div className="mt-6">
                <p className="section-label text-warm-ivory/30">
                  {dict['footer.social']}
                </p>
                <div className="mt-3 flex gap-2">
                  {socials.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (${dict['a11y.newTab']})`}
                      className="grid size-8 place-items-center rounded-full border border-warm-ivory/12 text-warm-ivory/60 transition-all duration-300 hover:border-brass hover:text-brass"
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-warm-ivory/10 pt-6 text-xs text-warm-ivory/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {dict['site.name']}. {dict['footer.legal']}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={settings.external.upcomingEvents}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-warm-ivory"
            >
              {dict['footer.external']}
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </a>
            <Link href="/admin" className="transition-colors hover:text-warm-ivory">
              {dict['footer.admin']}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
