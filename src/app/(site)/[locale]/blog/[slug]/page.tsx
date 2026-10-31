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
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-ivory/50">
          <CalendarDays className="size-3.5 text-brass" aria-hidden="true" />
          {formatDate(post.publishedAt, locale)}
        </p>
      </PageHeader>

      <div className="site-container py-12 lg:py-16">
        <article className="mx-auto max-w-3xl">
          {post.isFallback ? (
            <div className="mb-6">
              <FallbackNotice>{dict['page.notTranslated']}</FallbackNotice>
            </div>
          ) : null}
          {post.coverKey ? (
            <div className="image-reveal relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl bg-graphite shadow-card">
              <AppImage
                storageKey={post.coverKey}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 48rem"
                priority
              />
            </div>
          ) : null}
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: post.translation.bodyHtml }}
          />
          <Link
            href={`/${locale}/blog`}
            className="group mt-10 inline-flex items-center gap-1.5 text-sm font-bold text-sage transition-colors hover:text-carbon"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            {dict['blog.back']}
          </Link>
        </article>
      </div>
    </>
  );
}
