import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { indexLabel, localeAlternates } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { ContactForm } from '@/components/meridian/forms/contact-form';
import { ContactDetails } from '@/components/meridian/sections/contact-details';

interface EnquiriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EnquiriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['enquiries.title'],
    description: dict['enquiries.intro'],
    alternates: localeAlternates(locale, '/enquiries'),
  };
}

const TRACKS = ['enquiries.track.programme', 'enquiries.track.volunteer', 'enquiries.track.visit'] as const;

export default async function EnquiriesPage({ params }: EnquiriesPageProps) {
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
        crumbs={[{ label: dict['enquiries.title'] }]}
        eyebrow={dict['nav.contact']}
        title={dict['enquiries.title']}
        intro={dict['enquiries.intro']}
        motif="atom"
        meta={
          <ol className="grid max-w-3xl gap-px overflow-hidden rounded-(--mx-radius-sm) border border-(--mx-line) bg-(--mx-line) sm:grid-cols-3">
            {TRACKS.map((key, index) => (
              <li key={key} className="bg-(--mx-midnight) p-5">
                <span className="mx-mono-label text-(--mx-amber)">{indexLabel(index + 1)}</span>
                <p className="mt-2 text-[0.9375rem] leading-snug text-(--mx-fg-2)">{dict[key]}</p>
              </li>
            ))}
          </ol>
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-16 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 lg:order-2">
            <ContactForm locale={locale} dict={dict} />
          </div>
          <section aria-labelledby="enquiry-details-title" className="lg:col-span-5 lg:order-1">
            <h2 id="enquiry-details-title" className="mx-h3">
              {dict['contact.detailsTitle']}
            </h2>
            <div className="mt-8">
              <ContactDetails dict={dict} settings={settings} />
            </div>
            <Link href={`/${locale}/notices`} className="mx-link mt-8">
              {dict['enquiries.noticesCta']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
