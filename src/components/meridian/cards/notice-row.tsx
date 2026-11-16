import Link from 'next/link';
import { ArrowRight, Paperclip } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { excerptFromHtml } from '@/lib/sanitize';
import type { PublicNotice } from '@/server/public/queries';
import { cn } from '@/lib/utils';

interface NoticeRowProps {
  notice: PublicNotice;
  locale: LocaleCode;
  labels: { important: string; validUntil: string; attachments: string };
  showExcerpt?: boolean;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

/** Bulletin-ledger notice line: date column, priority, title, section, attachments. */
export function NoticeRow({
  notice,
  locale,
  labels,
  showExcerpt = true,
  headingLevel: Heading = 'h3',
  className,
}: NoticeRowProps) {
  const date = notice.publishAt ?? null;
  const excerpt = showExcerpt ? excerptFromHtml(notice.bodyHtml, 160) : '';
  return (
    <article
      className={cn(
        'group relative grid grid-cols-1 gap-3 border-t border-(--mx-line) py-6 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:gap-8',
        notice.isPinned && 'sm:before:absolute sm:before:-left-4 sm:before:top-7 sm:before:h-8 sm:before:w-0.5 sm:before:bg-(--mx-amber)',
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        {date ? (
          <time dateTime={date.toISOString()} className="text-[0.875rem] font-semibold text-(--mx-fg-2)">
            {formatDate(date, locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        ) : null}
        {notice.isPinned ? <span className="mx-tag mx-tag-amber">{labels.important}</span> : null}
      </div>
      <div className="min-w-0">
        <p className="mx-mono-label">{notice.sectionName}</p>
        <Heading className="mx-h4 mt-1.5 transition-colors duration-300 group-hover:text-(--mx-accent)">
          <Link href={`/${locale}/notices/${notice.slug}`} className="after:absolute after:inset-0">
            {notice.title}
          </Link>
        </Heading>
        {excerpt ? <p className="mx-line-clamp-2 mt-2 text-[0.9375rem] text-(--mx-fg-2)">{excerpt}</p> : null}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-(--mx-fg-3)">
          {notice.expireAt ? (
            <span>
              {labels.validUntil}: {formatDate(notice.expireAt, locale)}
            </span>
          ) : null}
          {notice.attachments.length ? (
            <span className="inline-flex items-center gap-1.5">
              <Paperclip className="size-3.5" aria-hidden="true" />
              {notice.attachments.length} {labels.attachments}
            </span>
          ) : null}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="hidden size-11 place-items-center self-center rounded-full border border-(--mx-line-strong) transition-all duration-500 group-hover:border-(--mx-fg) group-hover:bg-(--mx-fg) group-hover:text-(--mx-bg) sm:grid"
      >
        <ArrowRight className="size-4" />
      </span>
    </article>
  );
}
