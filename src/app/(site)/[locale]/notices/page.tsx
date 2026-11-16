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
            <h2 className="font-display text-2xl font-semibold text-midnight">{dict['notices.current']}</h2>
            <div className="mt-6 space-y-3.5">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/${locale}/notices/${notice.slug}`}
                    className="meridian-card group block p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-muted">
                      {notice.isPinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-solar/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
                          <Pin className="size-2.5" aria-hidden="true" />
                          {dict['notices.pinned']}
                        </span>
                      ) : null}
                      <span className="text-solar">{formatDate(notice.publishAt, locale)}</span>
                      <span className="text-slate-muted/50">·</span>
                      <span>{notice.sectionName}</span>
                      {notice.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[10px] font-bold text-cyan">
                          <FileText className="size-3" aria-hidden="true" />
                          {notice.attachments.length}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-midnight transition-colors duration-300 group-hover:text-solar">
                      {notice.title}
                    </h3>
                    {notice.bodyHtml ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-muted">
                        {excerptFromHtml(notice.bodyHtml, 200)}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors duration-300 group-hover:text-midnight">
                      {dict['common.readMore']}
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
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
              <section className="mt-14 border-t border-line pt-10">
                <h2 className="font-display text-xl font-semibold text-midnight">{dict['notices.archive']}</h2>
                <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white shadow-xs">
                  {archive.map((notice) => (
                    <li key={notice.id}>
                      <Link
                        href={`/${locale}/notices/${notice.slug}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 transition-colors hover:bg-warm-ivory/50"
                      >
                        <span className="font-medium text-midnight group-hover:text-solar">{notice.title}</span>
                        <span className="text-xs text-slate-muted font-medium">
                          {formatDate(notice.publishAt, locale)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
              <p className="section-label !text-solar">{dict['notices.type']}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-muted">{dict['notices.intro']}</p>
              <Link
                href={`/${locale}/contact`}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors hover:text-midnight"
              >
                {dict['nav.contact']}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-midnight p-6 text-warm-ivory border border-cosmic">
              <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="relative">
                <p className="font-display text-lg font-semibold text-white">{dict['home.events.title']}</p>
                <p className="mt-2 text-xs leading-relaxed text-warm-ivory/70">{dict['home.events.external']}</p>
                <Link
                  href={`/${locale}/events`}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-cyan transition-colors hover:text-solar"
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
