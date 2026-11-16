import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { getSiteSettings } from '@/server/services/settings';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ContactForm } from '@/components/site/contact-form';

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['contact.title'],
    description: dict['contact.intro'],
    alternates: {
      canonical: `${appUrl}/${locale}/contact`,
      languages: {
        'en-IN': `${appUrl}/en/contact`,
        'gu-IN': `${appUrl}/gu/contact`,
        'hi-IN': `${appUrl}/hi/contact`,
        'x-default': `${appUrl}/en/contact`,
      },
    },
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
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['contact.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.contact']}
        title={dict['contact.title']}
        intro={dict['contact.intro']}
      />

      <div className="site-container py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-12">
          <ContactForm locale={locale} dict={dict} />

          <div className="space-y-6">
            <div className="rounded-3xl border border-line bg-white p-7 shadow-xs">
              <h2 className="font-display text-xl font-semibold text-midnight">{dict['contact.detailsTitle']}</h2>
              <address className="mt-6 space-y-5 text-sm not-italic">
                <div className="flex gap-3.5">
                  <MapPin className="mt-0.5 size-4.5 shrink-0 text-cyan" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-muted">
                      {dict['contact.addressLabel']}
                    </p>
                    <p className="mt-1 text-midnight font-medium leading-relaxed">{settings.contact.address}</p>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <Phone className="mt-0.5 size-4.5 shrink-0 text-solar" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-muted">
                      {dict['footer.phoneLabel']}
                    </p>
                    <a
                      href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
                      className="mt-1 block font-medium text-midnight transition-colors hover:text-solar"
                    >
                      {settings.contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <Mail className="mt-0.5 size-4.5 shrink-0 text-teal-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-muted">
                      {dict['footer.emailLabel']}
                    </p>
                    <a
                      href={`mailto:${settings.contact.email}`}
                      className="mt-1 block break-all font-medium text-midnight transition-colors hover:text-cyan"
                    >
                      {settings.contact.email}
                    </a>
                    <a
                      href={`mailto:${settings.contact.generalEmail}`}
                      className="mt-1 block break-all text-xs text-slate-muted transition-colors hover:text-midnight"
                    >
                      {settings.contact.generalEmail}
                    </a>
                  </div>
                </div>
              </address>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-midnight p-7 text-warm-ivory border border-cosmic shadow-xl">
              <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-cyan/15" aria-hidden="true" />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-2xl bg-cyan/15 text-cyan shadow-inner">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-display text-xl font-semibold text-white">{dict['contact.mapLabel']}</h2>
                <p className="mt-2 text-xs leading-relaxed text-warm-ivory/70">{dict['contact.mapText']}</p>
                <a
                  href={settings.contact.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent mt-6 w-full !py-3 text-xs font-bold uppercase tracking-wider"
                >
                  {dict['home.visit.map']}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-warm-ivory/60 p-5">
              <p className="flex items-center gap-2.5 text-xs font-semibold text-slate-muted">
                <Clock className="size-4 text-teal-600" aria-hidden="true" />
                <span>{dict['contact.responseNote']}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
