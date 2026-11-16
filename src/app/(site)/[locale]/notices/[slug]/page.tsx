import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Download, FileText, Pin } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatFileSize, mediaUrl } from '@/lib/media';
import { getNoticeBySlug } from '@/server/public/queries';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FallbackNotice } from '@/components/ui/fallback-notice';
import { PageHeader } from '@/components/ui/page-header';

interface NoticeDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: NoticeDetailProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const notice = await getNoticeBySlug(slug, rawLocale);
  if (!notice) return { title: 'Notice not found' };
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: notice.title,
    description: notice.excerpt,
    alternates: { canonical: `${appUrl}/${rawLocale}/notices/${slug}` },
    openGraph: {
      type: 'article',
      title: notice.title,
      description: notice.excerpt,
      url: `${appUrl}/${rawLocale}/notices/${slug}`,
    },
  };
}

export default async function NoticeDetailPage({ params }: NoticeDetailProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const notice = await getNoticeBySlug(slug, locale);
  if (!notice) notFound();

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[
            { label: dict['notices.title'], href: `/${locale}/notices` },
            { label: notice.title },
          ]}
        />
      </div>
      <PageHeader tone="ink" eyebrow={notice.sectionLabel} title={notice.title}>
        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-ivory/70 font-semibold">
          {notice.isPinned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-solar/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-solar">
              <Pin className="size-3" aria-hidden="true" />
              {dict['notices.pinned']}
            </span>
          ) : null}
          <span className="text-solar">
            {dict['notices.publishDate']}: {formatDate(notice.publishAt, locale)}
          </span>
          {notice.expireAt ? (
            <span>
              · {dict['notices.validUntil']}: {formatDate(notice.expireAt, locale)}
            </span>
          ) : null}
        </div>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          {notice.isFallback ? (
            <div className="mb-6">
              <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
            </div>
          ) : null}

          <div
            className="prose-content rounded-3xl border border-line/70 bg-white p-7 sm:p-10 shadow-xs"
            dangerouslySetInnerHTML={{ __html: notice.translation.bodyHtml }}
          />

          {notice.translation.linkUrl ? (
            <a
              href={notice.translation.linkUrl}
              target={notice.translation.linkUrl.startsWith('http') ? '_blank' : undefined}
              rel={notice.translation.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="btn btn-primary mt-8"
            >
              {notice.translation.linkLabel || dict['common.learnMore']}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          ) : null}

          {notice.attachments.length > 0 ? (
            <section className="mt-10 border-t border-line/70 pt-8">
              <h2 className="font-display text-xl font-semibold text-midnight">
                {dict['common.downloads']}
              </h2>
              <ul className="mt-4 space-y-3">
                {notice.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={`${mediaUrl(attachment.storageKey)}?download=1`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 transition-all duration-300 hover:border-cyan hover:shadow-xs"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-midnight text-cyan">
                        <FileText className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-midnight group-hover:text-solar">
                          {attachment.title}
                        </span>
                        <span className="text-xs text-slate-muted font-medium">
                          {formatFileSize(attachment.sizeBytes)}
                        </span>
                      </span>
                      <span className="grid size-8 place-items-center rounded-full bg-cream text-slate-muted group-hover:bg-cyan/15 group-hover:text-cyan transition-colors">
                        <Download className="size-4" aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-10 border-t border-line/60 pt-6">
            <Link
              href={`/${locale}/notices`}
              className="group inline-flex items-center gap-2 text-sm font-bold text-teal-600 transition-colors hover:text-midnight"
            >
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              <span>{dict['common.back']}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
