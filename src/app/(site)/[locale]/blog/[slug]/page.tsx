import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { getBlogPostBySlug } from '@/server/public/queries';
import { AppImage } from '@/components/ui/app-image';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FallbackNotice } from '@/components/ui/fallback-notice';
import { PageHeader } from '@/components/ui/page-header';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const post = await getBlogPostBySlug(slug, rawLocale);
  if (!post) return { title: 'Post not found' };
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${appUrl}/${rawLocale}/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverKey ? [`${appUrl}/media/${post.coverKey}`] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const post = await getBlogPostBySlug(slug, locale);
  if (!post) notFound();

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[
            { label: dict['blog.title'], href: `/${locale}/blog` },
            { label: post.title },
          ]}
        />
      </div>
      <PageHeader tone="ink" eyebrow={post.category || post.sectionLabel} title={post.title}>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-warm-ivory/70">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-solar" aria-hidden="true" />
            {formatDate(post.publishedAt, locale)}
          </span>
          {post.category ? (
            <>
              <span className="text-white/30">·</span>
              <span className="rounded-full bg-cyan/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan">
                {post.category}
              </span>
            </>
          ) : null}
        </div>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <article className="mx-auto max-w-3xl">
          {post.isFallback ? (
            <div className="mb-6">
              <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
            </div>
          ) : null}
          {post.coverKey ? (
            <div className="image-reveal relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border border-line bg-midnight shadow-card">
              <AppImage
                storageKey={post.coverKey}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 48rem"
                priority
                className="object-cover"
              />
            </div>
          ) : null}
          <div
            className="prose-content rounded-3xl border border-line/70 bg-white p-7 sm:p-10 shadow-xs"
            dangerouslySetInnerHTML={{ __html: post.translation.bodyHtml }}
          />
          <div className="mt-10 flex items-center justify-between border-t border-line/60 pt-6">
            <Link
              href={`/${locale}/blog`}
              className="group inline-flex items-center gap-2 text-sm font-bold text-teal-600 transition-colors hover:text-midnight"
            >
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              <span>{dict['blog.back']}</span>
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
