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
        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-ivory/55">
          {notice.isPinned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brass/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brass">
              <Pin className="size-3" aria-hidden="true" />
              {dict['notices.pinned']}
            </span>
          ) : null}
          <span>
            {dict['notices.publishDate']}: {formatDate(notice.publishAt, locale)}
          </span>
          {notice.expireAt ? (
            <span>
              {dict['notices.validUntil']}: {formatDate(notice.expireAt, locale)}
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
            className="prose-content"
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
            <section className="mt-10 border-t border-line pt-7">
              <h2 className="font-display text-xl font-semibold">
                {dict['common.downloads']}
              </h2>
              <ul className="mt-4 space-y-2">
                {notice.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={`${mediaUrl(attachment.storageKey)}?download=1`}
                       className="group flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 transition-colors hover:border-brass/40"
                     >
                       <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-carbon text-warm-ivory">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {attachment.title}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formatFileSize(attachment.sizeBytes)}
                        </span>
                      </span>
                      <Download className="size-4 text-ink-muted" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

           <Link
             href={`/${locale}/notices`}
             className="group mt-10 inline-flex items-center gap-1.5 text-sm font-bold text-sage transition-colors hover:text-carbon"
           >
             <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
             {dict['common.back']}
           </Link>
        </div>
      </div>
    </>
  );
}
