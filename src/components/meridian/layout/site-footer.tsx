import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowUpRight, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import type { SiteSettings } from '@/lib/site-settings';
import { isSafeHttpUrl } from '@/lib/utils';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';
import { Logo } from './logo';

interface SiteFooterProps {
  locale: LocaleCode;
  dict: Dictionary;
  settings: SiteSettings;
}

export function SiteFooter({ locale, dict, settings }: SiteFooterProps) {
  const p = `/${locale}`;
  const year = new Date().getFullYear();

  const explore = [
    { label: dict['nav.about'], href: `${p}/about` },
    { label: dict['nav.projects'], href: `${p}/projects` },
    { label: dict['nav.activities'], href: `${p}/activities` },
    { label: dict['mx.nav.labs'], href: `${p}/infrastructure` },
    { label: dict['nav.publications'], href: `${p}/publications` },
    { label: dict['nav.gallery'], href: `${p}/gallery` },
  ];
  const updates = [
    { label: dict['nav.events'], href: `${p}/events` },
    { label: dict['nav.notices'], href: `${p}/notices` },
    { label: dict['nav.blog'], href: `${p}/blog` },
    { label: dict['nav.downloads'], href: `${p}/downloads` },
    { label: dict['enquiries.title'], href: `${p}/enquiries` },
    { label: dict['nav.search'], href: `${p}/search` },
  ];

  const socials = [
    { label: 'Facebook', href: settings.socials.facebook, Icon: Facebook },
    { label: 'Instagram', href: settings.socials.instagram, Icon: Instagram },
    { label: 'YouTube', href: settings.socials.youtube, Icon: Youtube },
    { label: 'X (Twitter)', href: settings.socials.twitter, Icon: Twitter },
  ].filter((social) => social.href && isSafeHttpUrl(social.href));

  const mapUrl = settings.contact.mapUrl && isSafeHttpUrl(settings.contact.mapUrl) ? settings.contact.mapUrl : null;

  return (
    <footer className="mx-surface-dark relative isolate overflow-hidden">
      <OrbitMotif
        variant="meridian"
        className="pointer-events-none absolute -bottom-64 -right-40 -z-10 w-[46rem] text-(--mx-ivory) opacity-[0.14]"
      />

      {/* Statement band */}
      <div className="mx-container border-b border-(--mx-line) py-16 sm:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="mx-display max-w-[14ch]" style={{ fontSize: 'clamp(2.4rem, 1.2rem + 4.6vw, 5.5rem)' }}>
            {dict['site.tagline']}
            <span className="mx-serif-accent text-(--mx-amber)">.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`${p}/visit`} className="mx-btn mx-btn-primary">
              {dict['mx.nav.visit']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
            <Link href={`${p}/events`} className="mx-btn mx-btn-ghost">
              {dict['nav.events']}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-container grid grid-cols-2 gap-x-6 gap-y-12 py-16 lg:grid-cols-12 lg:gap-10">
        <div className="col-span-2 lg:col-span-4">
          <Logo
            href={p}
            name={dict['site.shortName']}
            familiarName={dict['mx.brand.familiar']}
            alt={dict['mx.brand.logoAlt']}
            homeLabel={dict['mx.brand.home']}
            size="lg"
          />
          <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-(--mx-fg-2)">{dict['footer.about']}</p>
          <p className="mt-4 max-w-sm text-[0.8125rem] leading-relaxed text-(--mx-fg-3)">{dict['footer.parent']}</p>
        </div>

        <FooterColumn title={dict['footer.quickLinks']} links={explore} className="lg:col-span-2" />
        <FooterColumn title={dict['footer.connect']} links={updates} className="lg:col-span-2" />

        <div className="col-span-2 lg:col-span-4">
          <p className="mx-mono-label">{dict['footer.addressLabel']}</p>
          <ul className="mt-5 grid gap-4 text-[0.95rem]">
            {settings.contact.address ? (
              <li className="flex gap-3 text-(--mx-fg-2)">
                <MapPin className="mt-1 size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                <span>
                  <span className="sr-only">{dict['common.address']}: </span>
                  {settings.contact.address}
                  {mapUrl ? (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-[0.875rem] font-semibold text-(--mx-fg) hover:text-(--mx-cyan)"
                    >
                      {dict['home.visit.map']}
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">({dict['a11y.newTab']})</span>
                    </a>
                  ) : null}
                </span>
              </li>
            ) : null}
            {settings.contact.phone ? (
              <li>
                <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 text-(--mx-fg-2) hover:text-(--mx-fg)">
                  <Phone className="size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                  <span className="sr-only">{dict['footer.phoneLabel']}: </span>
                  {settings.contact.phone}
                </a>
              </li>
            ) : null}
            {[settings.contact.email, settings.contact.generalEmail]
              .filter((email, index, list) => email && list.indexOf(email) === index)
              .map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="flex items-center gap-3 break-all text-(--mx-fg-2) hover:text-(--mx-fg)">
                    <Mail className="size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                    <span className="sr-only">{dict['footer.emailLabel']}: </span>
                    {email}
                  </a>
                </li>
              ))}
          </ul>

          {socials.length ? (
            <div className="mt-8">
              <p className="mx-mono-label">{dict['footer.social']}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mx-icon-btn"
                      aria-label={`${label} (${dict['a11y.newTab']})`}
                    >
                      <Icon className="size-[1.05rem]" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-container border-t border-(--mx-line) py-8">
        <div className="flex flex-col gap-3 text-[0.8125rem] text-(--mx-fg-3)">
          <p>
            <span className="text-(--mx-fg-2)">{dict['mx.footer.partners']}:</span> {dict['mx.footer.sef']} ·{' '}
            {dict['mx.footer.rmc']} · {dict['mx.footer.gujcost']}
          </p>
          <p className="max-w-3xl">{dict['footer.policyNote']}</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-4 border-t border-(--mx-line) pt-6 text-[0.8125rem] text-(--mx-fg-3) sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {dict['site.name']}. {dict['footer.legal']}
          </p>
          <a href="#top" className="inline-flex min-h-11 items-center gap-2 font-semibold text-(--mx-fg-2) hover:text-(--mx-fg)">
            <ArrowUp className="size-4" aria-hidden="true" />
            {dict['mx.footer.backToTop']}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,

}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  className?: string;

}) {
  return (
    <div className={className}>
      <p className="mx-mono-label">{title}</p>
      <ul className="mt-5 grid gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center text-[0.95rem] text-(--mx-fg-2) transition-colors hover:text-(--mx-fg)"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
