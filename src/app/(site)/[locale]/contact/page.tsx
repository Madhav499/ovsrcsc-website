import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { localeAlternates } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { ContactForm } from '@/components/meridian/forms/contact-form';
import { ContactDetails } from '@/components/meridian/sections/contact-details';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['contact.title'],
    description: dict['contact.intro'],
    alternates: localeAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['contact.title'] }]}
        eyebrow={dict['home.visit.eyebrow']}
        title={dict['mx.home.visitTitle']}
        accent={dict['mx.home.visitTitleAccent']}
        intro={dict['home.visit.body']}
        aside={
          <figure className="mx-plate relative aspect-[16/10] w-full">
            <Image
              src={BRAND_PHOTOS.centreFacade}
              alt={dict['mx.home.visitCaption']}
              fill
              placeholder="blur"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <span aria-hidden="true" className="mx-ticks" />
            <figcaption className="absolute bottom-3 left-3 rounded-(--mx-radius-xs) bg-(--mx-midnight)/80 px-2.5 py-1 text-[0.75rem] font-semibold text-(--mx-ivory)">
              {dict['mx.home.visitCaption']}
            </figcaption>
          </figure>
        }
      />

      <div id="visit" className="mx-surface-ivory scroll-mt-24">
        <div className="mx-container mx-section !pt-16 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <section aria-labelledby="contact-details-title" className="lg:col-span-5">
            <h2 id="contact-details-title" className="mx-h2">
              {dict['contact.detailsTitle']}
            </h2>
            <p className="mt-4 max-w-md text-(--mx-fg-2)">{dict['contact.intro']}</p>
            <div className="mt-10">
              <ContactDetails dict={dict} settings={settings} />
            </div>
          </section>
          <div className="lg:col-span-7">
            <ContactForm locale={locale} dict={dict} />
          </div>
        </div>
      </div>
    </>
  );
}
