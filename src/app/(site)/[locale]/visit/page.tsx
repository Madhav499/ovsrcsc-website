import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { isSafeHttpUrl } from '@/lib/utils';
import { localeAlternates } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Parallax } from '@/components/meridian/motion/parallax';
import { Reveal } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { MapConsent } from '@/components/meridian/sections/map-consent';
import { EditorialHero } from '@/components/meridian/templates/editorial-hero';

interface VisitPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: VisitPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['mx.visit.metaTitle'],
    description: dict['mx.visit.description'],
    alternates: localeAlternates(locale, '/visit'),
  };
}

/**
 * Plan your visit. Essentials first (address, contact, timings guidance and
 * directions), then ways to visit, what is on campus and a click-to-load map.
 * Opening hours are not published by the center, so none are stated.
 */
export default async function VisitPage({ params }: VisitPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();
  const p = `/${locale}`;
  const { contact } = settings;
  const mapUrl = contact.mapUrl && isSafeHttpUrl(contact.mapUrl) ? contact.mapUrl : null;
  const emails = [contact.email, contact.generalEmail].filter((email, index, list) => email && list.indexOf(email) === index);

  const ways = [
    { title: dict['mx.visit.school'], text: dict['home.flagship.safarText'], href: `${p}/projects/vigyan-safar`, cta: dict['home.flagship.safar'] },
    { title: dict['mx.visit.group'], text: dict['mx.visit.groupText'], href: `${p}/enquiries`, cta: dict['mx.visit.enquire'] },
    { title: dict['mx.visit.alone'], text: dict['mx.visit.aloneText'], href: `${p}/projects`, cta: dict['nav.projects'] },
  ];
  const facilities = [
    { title: dict['mx.home.facility.museum.title'], text: dict['mx.home.facility.museum.text'], photo: BRAND_PHOTOS.scienceMuseum },
    { title: dict['mx.home.facility.labs.title'], text: dict['mx.home.facility.labs.text'], photo: BRAND_PHOTOS.physicsLab },
    { title: dict['mx.home.facility.library.title'], text: dict['mx.home.facility.library.text'], photo: BRAND_PHOTOS.library },
    { title: dict['mx.home.facility.auditorium.title'], text: dict['mx.home.facility.auditorium.text'], photo: BRAND_PHOTOS.amphitheatreNight },
  ];

  return (
    <>
      <EditorialHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['mx.visit.metaTitle'] }]}
        eyebrow={dict['home.visit.eyebrow']}
        title={dict['mx.visit.title']}
        accent={dict['mx.visit.titleAccent']}
        lede={dict['mx.visit.lede']}
        aside={
          <section aria-labelledby="visit-essentials">
            <h2 id="visit-essentials" className="mx-eyebrow">
              <span className="mx-eyebrow-index">01</span>
              {dict['mx.visit.essentials']}
            </h2>
            <dl aria-labelledby="visit-essentials" className="mt-4 grid gap-px overflow-hidden rounded-(--mx-radius-md) border border-(--mx-line) bg-(--mx-line) sm:grid-cols-2">
                {contact.address ? (
                  <div className="bg-(--mx-ivory) p-5">
                    <dt className="mx-mono-label flex items-center gap-2"><MapPin className="size-3.5 text-(--mx-accent-2)" aria-hidden="true" />{dict['contact.addressLabel']}</dt>
                    <dd className="mt-3 text-[1.0625rem] font-semibold leading-snug">{contact.address}</dd>
                    {mapUrl ? (
                      <dd className="mt-4">
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mx-link text-[0.9375rem]">
                          {dict['mx.contact.directions']}
                          <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                          <span className="sr-only">({dict['a11y.newTab']})</span>
                        </a>
                      </dd>
                    ) : null}
                  </div>
                ) : null}
                <div className="bg-(--mx-ivory) p-5">
                  <dt className="mx-mono-label flex items-center gap-2"><Clock className="size-3.5 text-(--mx-accent-2)" aria-hidden="true" />{dict['mx.visit.timings']}</dt>
                  <dd className="mt-3 text-[0.9375rem] leading-relaxed text-(--mx-fg-2)">{dict['mx.visit.timingsText']}</dd>
                </div>
                {contact.phone ? (
                  <div className="bg-(--mx-ivory) p-5">
                    <dt className="mx-mono-label flex items-center gap-2"><Phone className="size-3.5 text-(--mx-accent-2)" aria-hidden="true" />{dict['mx.contact.callUs']}</dt>
                    <dd className="mt-3">
                      <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="mx-readout text-[1.25rem] text-(--mx-fg) hover:text-(--mx-accent)">
                        {contact.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {emails.length ? (
                  <div className="bg-(--mx-ivory) p-5">
                    <dt className="mx-mono-label flex items-center gap-2"><Mail className="size-3.5 text-(--mx-accent-2)" aria-hidden="true" />{dict['mx.contact.writeTo']}</dt>
                    {emails.map((email) => (
                      <dd key={email} className="mt-3 break-all">
                        <a href={`mailto:${email}`} className="text-[0.9375rem] font-semibold hover:text-(--mx-accent)">{email}</a>
                      </dd>
                    ))}
                  </div>
                ) : null}
              </dl>
          </section>
        }
        folio={[dict['mx.home.visitCaption'], dict['mx.home.heroCoordinates']]}
        figure={
          <figure>
            <div className="mx-plate relative aspect-[16/9] overflow-hidden sm:aspect-[21/8]">
              <Parallax strength={70} className="absolute -inset-y-10 inset-x-0">
                <Image src={BRAND_PHOTOS.centreFacade} alt={dict['mx.home.visitCaption']} fill priority sizes="(max-width: 1408px) 100vw, 1408px" placeholder="blur" className="object-cover" />
              </Parallax>
              <span aria-hidden="true" className="mx-ticks" />
            </div>
            <figcaption className="mx-figcap">
              <span className="mx-figcap-num">{dict['mx.figure']} 01</span>
              <span>{dict['mx.home.visitCaption']}</span>
            </figcaption>
          </figure>
        }
      />

      {/* Ways to visit */}
      <section aria-labelledby="visit-ways" className="mx-surface-white mx-section">
        <div className="mx-container">
          <SectionHeading id="visit-ways" index="02" eyebrow={dict['mx.visit.ways']} title={dict['mx.visit.waysTitle']} accent={dict['mx.visit.waysAccent']} />
          <ol className="mx-ledger mt-14">
            {ways.map((way, index) => (
              <li key={way.title}>
                <Link href={way.href} className="group grid grid-cols-[minmax(0,1fr)] gap-4 py-8 md:grid-cols-[4rem_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-baseline md:gap-10">
                  <span className="mx-numeric text-[2.5rem] leading-none text-(--mx-accent-2)">{index + 1}</span>
                  <h3 className="mx-h3 transition-colors group-hover:text-(--mx-accent)">{way.title}</h3>
                  <p className="text-(--mx-fg-2)">{way.text}</p>
                  <span className="mx-link self-start text-[0.9375rem] md:self-center md:whitespace-nowrap">
                    {way.cta}
                    <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What you will find */}
      <section aria-labelledby="visit-find" className="mx-surface-stone mx-grain mx-section">
        <div className="mx-container">
          <SectionHeading
            id="visit-find"
            index="03"
            eyebrow={dict['mx.visit.find']}
            title={dict['mx.about.offerTitle']}
            accent={dict['mx.about.offerAccent']}
            align="split"
            action={
              <Link href={`${p}/infrastructure`} className="mx-btn mx-btn-ghost">
                {dict['mx.nav.labs']}
                <ArrowRight className="mx-btn-icon" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06} as="figure">
                <div className="mx-plate relative aspect-[4/3]">
                  <Image src={item.photo} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" placeholder="blur" className="object-cover" />
                  <span aria-hidden="true" className="mx-ticks" />
                </div>
                <figcaption className="mt-4">
                  <p className="mx-h4">{item.title}</p>
                  <p className="mt-1.5 text-[0.9375rem] text-(--mx-fg-2)">{item.text}</p>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Map + accessibility */}
      <section aria-labelledby="visit-map" className="mx-surface-ivory mx-section">
        <div className="mx-container grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <h2 id="visit-map" className="mx-h2">{dict['mx.visit.mapTitle']}</h2>
            <div className="mt-8">
              <MapConsent
                query={contact.address || settings.seo.organisationName}
                labels={{ load: dict['mx.visit.mapLoad'], note: dict['mx.visit.mapNote'], frame: dict['mx.visit.mapFrame'] }}
              />
            </div>
          </div>
          <aside className="min-w-0 border-t border-(--mx-line-strong) pt-6 lg:mt-20">
            <h2 className="mx-h4">{dict['mx.visit.access']}</h2>
            <p className="mt-3 text-(--mx-fg-2)">{dict['mx.visit.accessText']}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${p}/enquiries`} className="mx-btn mx-btn-primary">
                {dict['mx.visit.enquire']}
                <ArrowRight className="mx-btn-icon" aria-hidden="true" />
              </Link>
              <Link href={`${p}/contact`} className="mx-btn mx-btn-ghost">
                {dict['nav.contact']}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
