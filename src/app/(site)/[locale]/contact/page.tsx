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

          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-paper p-6">
              <h2 className="font-display text-xl font-medium">{dict['contact.detailsTitle']}</h2>
              <address className="mt-5 space-y-4 text-sm not-italic">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      {dict['contact.addressLabel']}
                    </p>
                    <p className="mt-0.5 text-ink-soft">{settings.contact.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      {dict['footer.phoneLabel']}
                    </p>
                    <a
                      href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
                      className="mt-0.5 block text-ink-soft transition-colors hover:text-carbon"
                    >
                      {settings.contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                      {dict['footer.emailLabel']}
                    </p>
                    <a
                      href={`mailto:${settings.contact.email}`}
                      className="mt-0.5 block break-all text-ink-soft transition-colors hover:text-carbon"
                    >
                      {settings.contact.email}
                    </a>
                    <a
                      href={`mailto:${settings.contact.generalEmail}`}
                      className="mt-1 block break-all text-xs text-ink-muted transition-colors hover:text-carbon"
                    >
                      {settings.contact.generalEmail}
                    </a>
                  </div>
                </div>
              </address>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-carbon p-6 text-warm-ivory">
              <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-warm-ivory/8" aria-hidden="true" />
              <div className="relative">
                <span className="grid size-10 place-items-center rounded-full bg-brass text-warm-ivory">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-xl font-medium">{dict['contact.mapLabel']}</h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-ivory/55">{dict['contact.mapText']}</p>
                <a
                  href={settings.contact.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent mt-5 w-full"
                >
                  {dict['home.visit.map']}
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-warm-ivory p-5">
              <p className="flex items-center gap-2 text-xs font-semibold text-sage">
                <Clock className="size-3.5" aria-hidden="true" />
                {dict['contact.responseNote']}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
