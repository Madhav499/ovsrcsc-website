import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, FlaskConical, Telescope, Users } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { getSiteSettings } from '@/server/services/settings';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/site/motion';
import { ContactForm } from '@/components/site/contact-form';

interface EnquiriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EnquiriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['enquiries.title'],
    description: dict['enquiries.intro'],
    alternates: {
      canonical: `${appUrl}/${locale}/enquiries`,
      languages: {
        'en-IN': `${appUrl}/en/enquiries`,
        'gu-IN': `${appUrl}/gu/enquiries`,
        'hi-IN': `${appUrl}/hi/enquiries`,
        'x-default': `${appUrl}/en/enquiries`,
      },
    },
  };
}

const ENQUIRY_TRACKS = [
  { Icon: FlaskConical, key: 'enquiries.track.programme' },
  { Icon: Users, key: 'enquiries.track.volunteer' },
  { Icon: Telescope, key: 'enquiries.track.visit' },
] as const;

export default async function EnquiriesPage({ params }: EnquiriesPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['enquiries.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.contact']}
        title={dict['enquiries.title']}
        intro={dict['enquiries.intro']}
      />

      <div className="site-container pb-16 pt-10 lg:pb-24 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <Reveal>
            <ContactForm locale={locale} dict={dict} />
          </Reveal>

          <Reveal delay={0.12} className="space-y-6">
            <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-1">
              {ENQUIRY_TRACKS.map(({ Icon, key }) => (
                <div
                  key={key}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-xs"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-midnight text-cyan">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium leading-snug text-midnight pt-0.5">{dict[key]}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-line bg-white p-7 shadow-xs">
              <h2 className="font-display text-lg font-semibold text-midnight">{dict['contact.detailsTitle']}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-muted">
                {settings.contact.address}
              </p>
              <div className="mt-5 space-y-2.5 text-sm font-medium">
                <a
                  href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
                  className="block text-midnight transition-colors hover:text-solar"
                >
                  {settings.contact.phone}
                </a>
                <a
                  href={`mailto:${settings.contact.email}`}
                  className="block break-all text-midnight transition-colors hover:text-cyan"
                >
                  {settings.contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-line bg-warm-ivory/60 p-4.5 text-xs leading-relaxed text-slate-muted">
              <Clock className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span>{dict['contact.responseNote']}</span>
            </div>

            <Link
              href={`/${locale}/notices`}
              className="group inline-flex items-center gap-2 text-sm font-bold text-teal-600 transition-colors hover:text-midnight pt-2"
            >
              <span>{dict['enquiries.noticesCta']}</span>
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>
      </div>
    </>
  );
}
