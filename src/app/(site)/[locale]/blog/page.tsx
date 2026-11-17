import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { ArrowUpRight } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { formatNumber, indexLabel, localeAlternates } from '@/lib/meridian/site';
import { repairText } from '@/lib/meridian/text';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { getPublishedBlogPosts } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { ArticleCard } from '@/components/meridian/cards/article-card';
import { Reveal } from '@/components/meridian/motion/reveal';
import { EmptyState } from '@/components/meridian/states/states';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict['blog.title'],
    description: dict['blog.intro'],
    alternates: localeAlternates(locale, '/blog'),
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const { category: rawCategory } = await searchParams;
  const posts = (await getPublishedBlogPosts(locale, 24)).map((post) => ({
    ...post,
    title: repairText(post.title),
    summary: repairText(post.summary),
  }));

  const categories = Array.from(
    new Set(posts.map((post) => post.category).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b));
  const category = rawCategory && categories.includes(rawCategory) ? rawCategory : null;
  const visible = category ? posts.filter((post) => post.category === category) : posts;
  const [featured, ...rest] = visible;
  const base = `/${locale}/blog`;

  return (
    <>
      <PageHero
        tone="light"
        motif="none"
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={[{ label: dict['blog.title'] }]}
        eyebrow={dict['nav.blog']}
        title={dict['blog.title']}
        intro={dict['blog.intro']}
        meta={
          posts.length ? (
            <p className="mx-mono-label">
              {formatNumber(posts.length, locale)} {dict['mx.blog.stories']}
            </p>
          ) : undefined
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container pb-[var(--mx-space-section)]">
          {categories.length > 1 ? (
            <nav aria-label={dict['mx.blog.filter']} className="mx-hide-scrollbar -mx-(--mx-gutter) overflow-x-auto px-(--mx-gutter)">
              <ul className="flex gap-2 border-t border-(--mx-line) pt-6">
                <li>
                  <Link href={base} className="mx-chip" aria-current={!category ? 'true' : undefined} scroll={false}>
                    {dict['common.all']}
                  </Link>
                </li>
                {categories.map((item) => (
                  <li key={item}>
                    <Link
                      href={`${base}?category=${encodeURIComponent(item)}`}
                      className="mx-chip"
                      aria-current={category === item ? 'true' : undefined}
                      scroll={false}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {featured ? (
            <>
              <section aria-label={dict['mx.blog.featured']} className="pt-12">
                <p className="mx-eyebrow">{dict['mx.blog.featured']}</p>
                <Reveal className="mt-6">
                  <ArticleCard
                    post={featured}
                    locale={locale}
                    readLabel={dict['common.readMore']}
                    variant="feature"
                    headingLevel="h2"
                    priority
                  />
                </Reveal>
              </section>

              {rest.length ? (
                <section aria-labelledby="journal-contents" className="mt-24">
                  <div className="flex items-baseline justify-between gap-6 border-b border-(--mx-line-strong) pb-4">
                    <h2 id="journal-contents" className="mx-h3">
                      {dict['mx.blog.contents']}
                    </h2>
                    <span className="mx-mono-label">
                      {formatNumber(rest.length, locale)} {dict['mx.blog.stories']}
                    </span>
                  </div>
                  <ol>
                    {rest.map((post, index) => (
                      <li key={post.id} className="border-b border-(--mx-line)">
                        <Reveal>
                          <Link
                            href={`${base}/${post.slug}`}
                            className="group grid gap-4 py-7 sm:grid-cols-[3.5rem_9rem_minmax(0,1fr)_8rem] sm:items-center sm:gap-8"
                          >
                            <span className="mx-mono-label">{indexLabel(index + 2)}</span>
                            <time dateTime={post.publishedAt.toISOString()} className="mx-mono-label normal-case">
                              {formatDate(post.publishedAt, locale)}
                            </time>
                            <span className="min-w-0">
                              {post.category ? <span className="mx-tag mb-2">{post.category}</span> : null}
                              <span className="mx-h4 block transition-colors duration-300 group-hover:text-(--mx-accent)">{post.title}</span>
                              {post.summary ? <span className="mx-line-clamp-2 mt-1.5 block text-[0.9375rem] text-(--mx-fg-2)">{post.summary}</span> : null}
                            </span>
                            {post.coverKey ? (
                              <span className="mx-plate relative hidden aspect-[4/3] overflow-hidden sm:block">
                                <CmsImage storageKey={post.coverKey} alt="" sizes="8rem" className="transition-transform duration-700 group-hover:scale-105" />
                              </span>
                            ) : (
                              <ArrowUpRight className="hidden size-5 justify-self-end text-(--mx-fg-3) sm:block" aria-hidden="true" />
                            )}
                          </Link>
                        </Reveal>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </>
          ) : (
            <EmptyState
              className="mt-12"
              title={dict['blog.empty']}
              action={
                <Link href={`/${locale}/events`} className="mx-btn mx-btn-ink">
                  {dict['nav.events']}
                </Link>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
