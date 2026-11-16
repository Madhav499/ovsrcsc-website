import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, FileText } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { formatFileSize, mediaUrl } from '@/lib/media';
import { isSafeLinkHref } from '@/lib/utils';
import { siteOrigin } from '@/lib/meridian/site';
import { getNoticeBySlug } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { FallbackNotice } from '@/components/meridian/states/states';

interface NoticeDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: NoticeDetailProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const notice = await getNoticeBySlug(slug, rawLocale);
  if (!notice) return { title: getDictionary(rawLocale)['notFound.title'] };
  return {
    title: notice.title,
    description: notice.excerpt,
    alternates: { canonical: `${siteOrigin()}/${rawLocale}/notices/${slug}` },
  };
}

function fileType(name: string, mimeType: string): string {
  const extension = name.split('.').pop();
  if (extension && extension.length <= 5 && extension !== name) return extension.toUpperCase();
  return mimeType.split('/').pop()?.toUpperCase() ?? '';
}

export default async function NoticeDetailPage({ params }: NoticeDetailProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const notice = await getNoticeBySlug(slug, locale);
  if (!notice) notFound();
  const p = `/${locale}`;
  const link = notice.translation.linkUrl && isSafeLinkHref(notice.translation.linkUrl) ? notice.translation.linkUrl : null;
  const external = Boolean(link?.startsWith('http'));

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['notices.title'], href: `${p}/notices` }, { label: notice.title }]}
        eyebrow={notice.sectionLabel}
        title={notice.title}
        motif="meridian"
        meta={
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {notice.publishAt ? (
              <div>
                <dt className="mx-mono-label">{dict['notices.publishDate']}</dt>
                <dd className="mt-1 font-semibold">{formatDate(notice.publishAt, locale)}</dd>
              </div>
            ) : null}
            {notice.expireAt ? (
              <div>
                <dt className="mx-mono-label">{dict['notices.validUntil']}</dt>
                <dd className="mt-1 font-semibold">{formatDate(notice.expireAt, locale)}</dd>
              </div>
            ) : null}
            {notice.isPinned ? (
              <div className="self-end">
                <span className="mx-tag mx-tag-amber">{dict['mx.notices.important']}</span>
              </div>
            ) : null}
          </dl>
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-14 sm:!pt-20">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
            <article className="min-w-0">
              {notice.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
              <div className="mx-prose" dangerouslySetInnerHTML={{ __html: notice.translation.bodyHtml }} />
              {link ? (
                <a
                  href={link}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="mx-btn mx-btn-ink mt-10"
                >
                  {notice.translation.linkLabel || dict['mx.notices.openLink']}
                  {external ? (
                    <>
                      <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                      <span className="sr-only">({dict['a11y.newTab']})</span>
                    </>
                  ) : (
                    <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                  )}
                </a>
              ) : null}
              <div className="mt-14 border-t border-(--mx-line-strong) pt-8">
                <Link href={`${p}/notices`} className="mx-btn mx-btn-ghost">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {dict['mx.notices.all']}
                </Link>
              </div>
            </article>

            {notice.attachments.length ? (
              <aside aria-labelledby="notice-attachments" className="min-w-0">
                <div className="mx-surface-white rounded-(--mx-radius-md) p-6 shadow-[var(--mx-shadow-sm)] lg:sticky lg:top-[calc(var(--mx-header-h)+1.5rem)]">
                  <h2 id="notice-attachments" className="mx-mono-label">
                    {dict['mx.notices.attachments']}
                  </h2>
                  <ul className="mt-4 grid gap-2">
                    {notice.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={`${mediaUrl(attachment.storageKey)}?download=1`}
                          className="group flex items-center gap-4 rounded-(--mx-radius-sm) border border-(--mx-line) p-3.5 transition-colors hover:border-(--mx-fg)"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-(--mx-radius-sm) bg-(--mx-sunken)">
                            <FileText className="size-5 text-(--mx-accent)" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{attachment.title || attachment.originalName}</span>
                            <span className="mx-meta">
                              {fileType(attachment.originalName, attachment.mimeType)} · {formatFileSize(attachment.sizeBytes)}
                            </span>
                          </span>
                          <Download className="size-4 shrink-0 text-(--mx-fg-3) group-hover:text-(--mx-fg)" aria-hidden="true" />
                          <span className="sr-only">{dict['common.download']}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
