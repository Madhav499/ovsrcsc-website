import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import type { SiteSettings } from '@/lib/site-settings';
import { isSafeHttpUrl } from '@/lib/utils';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Reveal } from '@/components/meridian/motion/reveal';

export function HomeVisit({
  locale,
  dict,
  settings,
}: {
  locale: LocaleCode;
  dict: Dictionary;
  settings: SiteSettings;
}) {
  const mapUrl = settings.contact.mapUrl && isSafeHttpUrl(settings.contact.mapUrl) ? settings.contact.mapUrl : null;
  return (
    <section aria-labelledby="home-visit-title" className="mx-surface-ivory pb-[var(--mx-space-section)]">
      <div className="mx-container">
        <Reveal variant="mask">
          <div className="grid overflow-hidden rounded-(--mx-radius-md) lg:grid-cols-12">
            <figure className="relative min-h-[18rem] lg:col-span-7 lg:min-h-[36rem]">
              <Image
                src={BRAND_PHOTOS.centreFacade}
                alt={dict['mx.home.visitCaption']}
                fill
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <span aria-hidden="true" className="mx-ticks" />
              <figcaption className="absolute bottom-4 left-4 rounded-(--mx-radius-xs) bg-(--mx-midnight)/80 px-3 py-1.5 text-[0.75rem] font-semibold text-(--mx-ivory) backdrop-blur">
                {dict['mx.home.visitCaption']}
              </figcaption>
            </figure>
            <div className="mx-surface-dark relative isolate p-8 sm:p-12 lg:col-span-5 lg:p-14">
              <div aria-hidden="true" className="mx-atmosphere absolute inset-0 -z-10" />
              <p className="mx-eyebrow">
                <span className="mx-eyebrow-index">09</span>
                <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" />
                {dict['home.visit.eyebrow']}
              </p>
              <h2 id="home-visit-title" className="mx-h2 mt-6">
                {dict['mx.home.visitTitle']}{' '}
                <span className="mx-serif-accent text-(--mx-amber)">{dict['mx.home.visitTitleAccent']}</span>
              </h2>
              <p className="mt-6 text-(--mx-fg-2)">{dict['home.visit.body']}</p>
              <ul className="mt-8 grid gap-4 border-t border-(--mx-line) pt-8 text-[0.9375rem]">
                {settings.contact.address ? (
                  <li className="flex gap-3 text-(--mx-fg-2)">
                    <MapPin className="mt-1 size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                    <span>
                      <span className="sr-only">{dict['common.address']}: </span>
                      {settings.contact.address}
                    </span>
                  </li>
                ) : null}
                {settings.contact.phone ? (
                  <li>
                    <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 text-(--mx-fg-2) hover:text-(--mx-fg)">
                      <Phone className="size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                      <span className="sr-only">{dict['common.phone']}: </span>
                      {settings.contact.phone}
                    </a>
                  </li>
                ) : null}
                {settings.contact.email ? (
                  <li>
                    <a href={`mailto:${settings.contact.email}`} className="flex items-center gap-3 break-all text-(--mx-fg-2) hover:text-(--mx-fg)">
                      <Mail className="size-4 shrink-0 text-(--mx-cyan)" aria-hidden="true" />
                      <span className="sr-only">{dict['common.email']}: </span>
                      {settings.contact.email}
                    </a>
                  </li>
                ) : null}
              </ul>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href={`/${locale}/contact`} className="mx-btn mx-btn-primary">
                  {dict['home.visit.cta']}
                  <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                </Link>
                {mapUrl ? (
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mx-btn mx-btn-ghost">
                    {dict['home.visit.map']}
                    <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                    <span className="sr-only">({dict['a11y.newTab']})</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
