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
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className={cn(
                  'meridian-card group flex flex-col overflow-hidden',
                  index === 0 && posts.length > 1 && 'md:col-span-2 xl:col-span-3 xl:flex-row',
                )}
              >
                {post.coverKey ? (
                  <div
                    className={cn(
                      'relative overflow-hidden bg-warm-ivory',
                      index === 0 && posts.length > 1
                        ? 'aspect-[16/10] md:aspect-[16/9] xl:w-1/2 xl:aspect-auto'
                        : 'aspect-[16/10]',
                    )}
                  >
                    <AppImage
                      storageKey={post.coverKey}
                      alt={post.title}
                      fill
                      sizes={index === 0 ? '(max-width: 1280px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'}
                      priority={index === 0}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 rounded-full bg-midnight/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan backdrop-blur-md">
                      {post.category || post.sectionName}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'relative overflow-hidden bg-midnight p-7 text-warm-ivory border-b border-cosmic',
                      index === 0 && posts.length > 1 && 'xl:w-1/2 xl:border-b-0 xl:border-r',
                    )}
                  >
                    <div className="science-grid-dark absolute inset-0 opacity-40" aria-hidden="true" />
                    <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full border border-cyan/15" />
                    <div className="relative">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">
                        {post.category || post.sectionName}
                      </p>
                      <p className="mt-6 font-display text-2xl font-semibold leading-tight text-white">
                        {post.title}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-muted">
                    <span className="text-solar">{formatDate(post.publishedAt, locale)}</span>
                    <span>·</span>
                    <span>{post.category || post.sectionName}</span>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-midnight transition-colors duration-300 group-hover:text-solar sm:text-2xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-muted">
                    {post.summary}
                  </p>
                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 transition-colors duration-300 group-hover:text-midnight">
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
