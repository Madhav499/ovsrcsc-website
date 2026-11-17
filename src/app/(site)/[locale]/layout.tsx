import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { meridianFontVariables } from '@/lib/meridian-fonts';
import { siteOrigin } from '@/lib/meridian/site';
import { getSiteSettings } from '@/server/services/settings';
import { getActiveAnnouncement } from '@/server/public/queries';
import { SiteHeader } from '@/components/meridian/navigation/site-header';
import { SiteFooter } from '@/components/meridian/layout/site-footer';
import { AnnouncementDialog } from '@/components/meridian/layout/announcement-dialog';
import { MeridianMotionProvider } from '@/components/meridian/motion/reveal';
import { JsonLd } from '@/components/meridian/primitives/json-ld';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import '@/app/globals.css';
import '@/styles/meridian/meridian.css';

export const dynamic = 'force-dynamic';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const origin = siteOrigin();
  const defaultTitle = `${dict['site.name']} | ${dict['site.tagline']}`;
  return {
    metadataBase: new URL(origin),
    title: {
      default: defaultTitle,
      template: `%s | ${dict['site.shortName']}`,
    },
    description: dict['site.description'],
    applicationName: dict['site.name'],
    authors: [{ name: dict['site.name'] }],
    keywords: [
      'science center Rajkot',
      'community science centre',
      'Lok Vigyan Kendra Rajkot',
      'OVSRCSC',
      'Sunday Science School',
      'Aryabhatt Science Museum',
      'Big Bang Astronomy Club',
      'Vigyan Safar',
      'Vigyan Darshan',
    ],
    openGraph: {
      type: 'website',
      siteName: dict['site.name'],
      locale: LOCALE_LABELS[locale].htmlLang.replace('-', '_'),
      title: defaultTitle,
      description: dict['site.description'],
      url: `${origin}/${locale}`,
      images: [
        {
          url: BRAND_PHOTOS.telescopes.src,
          width: BRAND_PHOTOS.telescopes.width,
          height: BRAND_PHOTOS.telescopes.height,
          alt: dict['mx.home.heroPlateCaption'],
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: dict['site.description'],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#222b33',
  colorScheme: 'light',
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [settings, announcement] = await Promise.all([
    getSiteSettings(),
    getActiveAnnouncement(locale),
  ]);
  const origin = siteOrigin();

  const organization = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'Museum'],
    name: dict['site.name'],
    alternateName: [dict['site.shortName'], dict['mx.brand.familiar']],
    url: `${origin}/${locale}`,
    foundingDate: '1997',
    slogan: dict['site.tagline'],
    description: dict['site.description'],
    address: settings.contact.address || undefined,
    telephone: settings.contact.phone || undefined,
    email: settings.contact.email || undefined,
    parentOrganization: { '@type': 'Organization', name: 'Saurashtra Education Foundation' },
    sameAs: Object.values(settings.socials).filter((url) => url.startsWith('http')),
  };

  return (
    <html lang={LOCALE_LABELS[locale].htmlLang} className={meridianFontVariables}>
      <body data-site="meridian">
        <div id="top" />
        <a href="#main-content" className="mx-skip-link">
          {dict['common.skipToContent']}
        </a>
        <MeridianMotionProvider>
          <SiteHeader locale={locale} dict={dict} settings={settings} />
          <main id="main-content" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter locale={locale} dict={dict} settings={settings} />
          {announcement ? (
            <AnnouncementDialog
              announcement={announcement}
              labels={{
                close: dict['popup.close'],
                label: dict['popup.label'],
                link: dict['popup.link'],
                newTab: dict['a11y.newTab'],
              }}
            />
          ) : null}
        </MeridianMotionProvider>
        <JsonLd data={organization} />
      </body>
    </html>
  );
}
