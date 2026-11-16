import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

export interface ArticleSummary {
  slug: string;
  title: string;
  summary: string;
  coverKey: string | null;
  category: string | null;
  publishedAt: Date;
  sectionName: string;
}

interface ArticleCardProps {
  post: ArticleSummary;
  locale: LocaleCode;
  readLabel: string;
  variant?: 'feature' | 'standard' | 'compact';
  headingLevel?: 'h2' | 'h3';
  priority?: boolean;
  className?: string;
}

function CoverFallback() {
  return (
    <div className="mx-surface-navy absolute inset-0">
      <div aria-hidden="true" className="mx-atmosphere absolute inset-0" />
      <OrbitMotif variant="atom" animated={false} className="absolute left-1/2 top-1/2 w-2/3 -translate-x-1/2 -translate-y-1/2 text-(--mx-ivory) opacity-60" />
    </div>
  );
}

/** Editorial article card for activity-blog posts. */
export function ArticleCard({
  post,
  locale,
  readLabel,
  variant = 'standard',
  headingLevel: Heading = 'h3',
  priority = false,
  className,
}: ArticleCardProps) {
  const href = `/${locale}/blog/${post.slug}`;
  const label = post.category || post.sectionName;
  const date = formatDate(post.publishedAt, locale);

  if (variant === 'compact') {
    return (
      <article className={cn('group relative border-t border-(--mx-line) py-6', className)}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {label ? <span className="mx-mono-label text-(--mx-accent)">{label}</span> : null}
          <time dateTime={post.publishedAt.toISOString()} className="mx-meta">
            {date}
          </time>
        </p>
        <Heading className="mx-h4 mt-2 transition-colors duration-300 group-hover:text-(--mx-accent)">
          <Link href={href} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
      </article>
    );
  }

  if (variant === 'feature') {
    return (
      <article className={cn('group relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-14', className)}>
        <div className="mx-plate mx-zoom relative aspect-[16/11]">
          {post.coverKey ? (
            <CmsImage storageKey={post.coverKey} alt="" sizes="(max-width: 1024px) 100vw, 55vw" priority={priority} />
          ) : (
            <CoverFallback />
          )}
          <span aria-hidden="true" className="mx-ticks" />
        </div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {label ? <span className="mx-tag">{label}</span> : null}
            <time dateTime={post.publishedAt.toISOString()} className="mx-meta">
              {date}
            </time>
          </p>
          <Heading className="mx-h2 mt-5 !max-w-none" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 1.8vw, 2.75rem)' }}>
            <Link href={href} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </Heading>
          {post.summary ? <p className="mx-line-clamp-3 mt-5 text-[1.0625rem] text-(--mx-fg-2)">{post.summary}</p> : null}
          <span className="mx-link mt-7">
            {readLabel}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="mx-plate mx-zoom relative aspect-[4/3]">
        {post.coverKey ? (
          <CmsImage storageKey={post.coverKey} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        ) : (
          <CoverFallback />
        )}
      </div>
      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {label ? <span className="mx-mono-label text-(--mx-accent)">{label}</span> : null}
        <time dateTime={post.publishedAt.toISOString()} className="mx-meta">
          {date}
        </time>
      </p>
      <Heading className="mx-h4 mt-2.5 transition-colors duration-300 group-hover:text-(--mx-accent)">
        <Link href={href} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </Heading>
      {post.summary ? <p className="mx-line-clamp-2 mt-2.5 text-[0.9375rem] text-(--mx-fg-2)">{post.summary}</p> : null}
    </article>
  );
}
