import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Newspaper } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { getPublishedBlogPosts } from '@/server/public/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/empty-state';
import { AppImage } from '@/components/ui/app-image';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  return {
    title: dict['blog.title'],
    description: dict['blog.intro'],
    alternates: {
      canonical: `${appUrl}/${locale}/blog`,
      languages: {
        'en-IN': `${appUrl}/en/blog`,
        'gu-IN': `${appUrl}/gu/blog`,
        'hi-IN': `${appUrl}/hi/blog`,
        'x-default': `${appUrl}/en/blog`,
      },
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const posts = await getPublishedBlogPosts(locale, 24);

  return (
    <>
      <div className="site-container">
        <Breadcrumbs
          locale={locale}
          homeLabel={dict['page.breadcrumbHome']}
          ariaLabel={dict['nav.breadcrumb']}
          items={[{ label: dict['blog.title'] }]}
        />
      </div>
      <PageHeader tone="ink" eyebrow={dict['nav.blog']} title={dict['blog.title']} intro={dict['blog.intro']} />

      <div className="site-container py-12 lg:py-16">
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-all duration-500 hover:-translate-y-1 hover:border-brass/30 hover:shadow-soft"
              >
                {post.coverKey ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-warm-ivory">
                    <AppImage
                      storageKey={post.coverKey}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index < 3}
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-carbon px-6 py-8 text-warm-ivory">
                    <div className="science-grid-dark absolute inset-0" aria-hidden="true" />
                    <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full border border-warm-ivory/8" />
                    <div className="relative">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brass">
                        {post.category || post.sectionName}
                      </p>
                      <p className="mt-6 font-display text-2xl font-medium leading-tight">
                        {post.title}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-ink-muted">
                    <span>{formatDate(post.publishedAt, locale)}</span>
                    <span className="text-ink-muted/50">·</span>
                    <span>{post.category || post.sectionName}</span>
                  </div>
                  {post.coverKey ? (
                    <h2 className="mt-2.5 font-display text-lg font-medium leading-snug text-carbon transition-colors duration-300 group-hover:text-brass-dark">
                      {post.title}
                    </h2>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                    {post.summary}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold text-sage transition-colors duration-300 group-hover:text-carbon">
                    {dict['common.readMore']}
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden="true" />}>
            {dict['blog.empty']}
          </EmptyState>
        )}
      </div>
    </>
  );
}
