import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { formatNumber, localeAlternates } from '@/lib/meridian/site';
import { getPublishedBlogPosts } from '@/server/public/queries';
import { PageHero } from '@/components/meridian/layout/page-hero';
import { ArticleCard } from '@/components/meridian/cards/article-card';
import { Reveal, Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
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
  const posts = await getPublishedBlogPosts(locale, 24);

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
                <Stagger className="mt-20 grid gap-x-8 gap-y-14 border-t border-(--mx-line-strong) pt-14 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <StaggerItem key={post.id}>
                      <ArticleCard post={post} locale={locale} readLabel={dict['common.readMore']} headingLevel="h2" />
                    </StaggerItem>
                  ))}
                </Stagger>
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
