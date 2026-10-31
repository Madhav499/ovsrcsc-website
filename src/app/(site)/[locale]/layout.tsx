import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import { LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { fontVariables } from '@/lib/fonts';
import { getSiteSettings } from '@/server/services/settings';
import { getActiveAnnouncement } from '@/server/public/queries';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { AnnouncementModal } from '@/components/site/announcement-modal';
import '@/app/globals.css';

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
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: `${dict['site.name']} | ${dict['site.tagline']}`,
      template: `%s | ${dict['site.shortName']}`,
    },
    description: dict['site.description'],
    applicationName: dict['site.name'],
    authors: [{ name: dict['site.name'] }],
    keywords: [
      'science center Rajkot',
      'community science centre',
      'OVSRCSC',
      'Sunday Science School',
      'science museum Rajkot',
      'Vigyan Safar',
      'Vigyan Darshan',
    ],
    openGraph: {
      type: 'website',
      siteName: dict['site.name'],
      locale: LOCALE_LABELS[locale].htmlLang,
      title: `${dict['site.name']} | ${dict['site.tagline']}`,
      description: dict['site.description'],
      url: `${appUrl}/${locale}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dict['site.name']} | ${dict['site.tagline']}`,
      description: dict['site.description'],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#202321',
  colorScheme: 'light',
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [settings, announcement, requestHeaders] = await Promise.all([
    getSiteSettings(),
    getActiveAnnouncement(locale),
    headers(),
  ]);
  const activePath = requestHeaders.get('x-ovsrcsc-path') ?? `/${locale}`;

  return (
    <html lang={LOCALE_LABELS[locale].htmlLang} className={fontVariables}>
      <body>
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-br-xl bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-0 focus:top-0"
        >
          {dict['common.skipToContent']}
        </a>
        <SiteHeader locale={locale} dict={dict} settings={settings} activePath={activePath} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={locale} dict={dict} settings={settings} />
        {announcement ? (
          <AnnouncementModal
            announcement={announcement}
            labels={{
              close: dict['popup.close'],
              label: dict['popup.label'],
              link: dict['popup.link'],
            }}
          />
        ) : null}
      </body>
    </html>
  );
}
