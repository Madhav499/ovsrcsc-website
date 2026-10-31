import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Bell, FileText, Pin } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { excerptFromHtml } from '@/lib/sanitize';
import { getActiveNotices, getNoticeArchive } from '@/server/public/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';

interface NoticesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NoticesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['notices.title'],
    description: dict['notices.intro'],
    alternates: {
      canonical: `${appUrl}/${locale}/notices`,
      languages: {
        'en-IN': `${appUrl}/en/notices`,
        'gu-IN': `${appUrl}/gu/notices`,
        'hi-IN': `${appUrl}/hi/notices`,
        'x-default': `${appUrl}/en/notices`,
      },
    },
  };
}

export default async function NoticesPage({ params }: NoticesPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const [notices, archive] = await Promise.all([
    getActiveNotices(locale, 30),
    getNoticeArchive(locale, 20),
  ]);

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['notices.title'] }]}
        />
      </div>
      <PageHeader
        tone="ink"
        eyebrow={dict['nav.notices']}
        title={dict['notices.title']}
        intro={dict['notices.intro']}
      />

      <div className="site-container py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
          <div>
            <h2 className="font-display text-2xl font-semibold">{dict['notices.current']}</h2>
            <div className="mt-6 space-y-3">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/${locale}/notices/${notice.slug}`}
                    className="group block rounded-xl border border-line bg-paper p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-brass/30 hover:shadow-card sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-ink-muted">
                      {notice.isPinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brass/12 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brass-dark">
                          <Pin className="size-2.5" aria-hidden="true" />
                          {dict['notices.pinned']}
                        </span>
                      ) : null}
                      <span>{formatDate(notice.publishAt, locale)}</span>
                      <span className="text-ink-muted/50">·</span>
                      <span>{notice.sectionName}</span>
                      {notice.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" aria-hidden="true" />
                          {notice.attachments.length}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2.5 font-display text-lg font-medium leading-snug text-carbon transition-colors duration-300 group-hover:text-brass-dark">
                      {notice.title}
                    </h3>
                    {notice.bodyHtml ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                        {excerptFromHtml(notice.bodyHtml, 200)}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sage transition-colors duration-300 group-hover:text-carbon">
                      {dict['common.readMore']}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState icon={<Bell className="size-5" aria-hidden="true" />}>
                  {dict['notices.empty']}
                </EmptyState>
              )}
            </div>

            {archive.length > 0 ? (
              <section className="mt-12 border-t border-line pt-8">
                <h2 className="font-display text-xl font-medium">{dict['notices.archive']}</h2>
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
                  {archive.map((notice) => (
                    <li key={notice.id}>
                      <Link
                        href={`/${locale}/notices/${notice.slug}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 transition-colors hover:bg-warm-ivory"
                      >
                        <span className="font-medium text-carbon">{notice.title}</span>
                        <span className="text-xs text-ink-muted">
                          {formatDate(notice.publishAt, locale)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-paper p-5">
              <p className="section-label">{dict['notices.type']}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{dict['notices.intro']}</p>
              <Link
                href={`/${locale}/contact`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sage transition-colors hover:text-carbon"
              >
                {dict['nav.contact']}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-carbon p-5 text-warm-ivory">
              <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
              <div className="relative">
                <p className="font-display text-lg font-medium">{dict['home.events.title']}</p>
                <p className="mt-2 text-xs text-warm-ivory/50">{dict['home.events.external']}</p>
                <Link
                  href={`/${locale}/events`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brass transition-colors hover:text-warm-ivory"
                >
                  {dict['events.title']}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
