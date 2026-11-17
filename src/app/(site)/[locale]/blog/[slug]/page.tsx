import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { getDictionary, isLocale } from '@/i18n';
import { LOCALE_LABELS, type LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { countWords } from '@/lib/sanitize';
import { formatNumber, siteOrigin } from '@/lib/meridian/site';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/server/public/queries';
import { Breadcrumbs } from '@/components/meridian/layout/breadcrumbs';
import { ArticleCard } from '@/components/meridian/cards/article-card';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { repairText } from '@/lib/meridian/text';
import { ScrollProgress } from '@/components/meridian/story/scroll-progress';
import { JsonLd } from '@/components/meridian/primitives/json-ld';
import { Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { FallbackNotice } from '@/components/meridian/states/states';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const post = await getBlogPostBySlug(slug, rawLocale);
  if (!post) return { title: getDictionary(rawLocale)['notFound.title'] };
  const origin = siteOrigin();
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${origin}/${rawLocale}/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverKey ? [`${origin}/media/${post.coverKey}`] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: LocaleCode = rawLocale;
  const dict = getDictionary(locale);
  const found = await getBlogPostBySlug(slug, locale);
  if (!found) notFound();
  const post = {
    ...found,
    title: repairText(found.title),
    excerpt: repairText(found.excerpt),
    translation: { ...found.translation, bodyHtml: repairText(found.translation.bodyHtml) },
  };

  const recent = (await getPublishedBlogPosts(locale, 4)).map((item) => ({ ...item, title: repairText(item.title), summary: repairText(item.summary) }));
  const related = recent.filter((item) => item.slug !== post.slug).slice(0, 3);
  const published = post.publishedAt ?? post.createdAt;
  const minutes = Math.max(1, Math.round(countWords(post.translation.bodyHtml) / 200));
  const label = post.category || post.sectionLabel;
  const origin = siteOrigin();
  const p = `/${locale}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: published.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: LOCALE_LABELS[locale].htmlLang,
    image: post.coverKey ? `${origin}/media/${post.coverKey}` : undefined,
    mainEntityOfPage: `${origin}${p}/blog/${post.slug}`,
    author: { '@type': 'Organization', name: dict['site.name'] },
    publisher: { '@type': 'Organization', name: dict['site.name'] },
  };

  return (
    <>
      <ScrollProgress />
      <header data-mx-hero="light" className="mx-surface-stone mx-grain relative isolate overflow-hidden">
        <div aria-hidden="true" className="mx-gridlines pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div className="mx-container mx-hero-offset pb-12 sm:pb-16">
          <Breadcrumbs
            homeHref={p}
            homeLabel={dict['page.breadcrumbHome']}
            ariaLabel={dict['nav.breadcrumb']}
            items={[{ label: dict['blog.title'], href: `${p}/blog` }, { label: post.title }]}
          />
          <div className="mx-auto mt-12 max-w-4xl text-center sm:mt-16">
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {label ? <span className="mx-tag">{label}</span> : null}
              <time dateTime={published.toISOString()} className="mx-meta">
                {formatDate(published, locale)}
              </time>
              <span className="mx-meta inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {formatNumber(minutes, locale)} {dict['common.readingTime']}
              </span>
            </p>
            <h1 className="mx-h1 mx-auto mt-7 max-w-[22ch]">{post.title}</h1>
            {post.excerpt ? <p className="mx-lede mx-auto mt-7 max-w-2xl">{post.excerpt}</p> : null}
          </div>
        </div>
        {post.coverKey ? (
          <div className="mx-container">
            <figure className="mx-plate relative mx-auto aspect-[16/9] max-w-6xl translate-y-0">
              <CmsImage storageKey={post.coverKey} alt={post.title} sizes="(max-width: 1280px) 100vw, 1152px" priority />
              <span aria-hidden="true" className="mx-ticks" />
            </figure>
          </div>
        ) : null}
      </header>

      <div className="mx-surface-ivory">
        <article className="mx-container-narrow pb-[var(--mx-space-section)] pt-14 sm:pt-20">
          {post.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
          <div className="mx-prose mx-prose-journal mx-dropcap" dangerouslySetInnerHTML={{ __html: post.translation.bodyHtml }} />
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-(--mx-line-strong) pt-8">
            <Link href={`${p}/blog`} className="mx-btn mx-btn-ghost">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {dict['blog.back']}
            </Link>
            <p className="mx-meta">
              {dict['common.updatedOn']}: {formatDate(post.updatedAt, locale)}
            </p>
          </div>
        </article>
      </div>

      {related.length ? (
        <section aria-labelledby="related-posts" className="mx-surface-white mx-section">
          <div className="mx-container">
            <h2 id="related-posts" className="mx-h3">
              {dict['mx.blog.related']}
            </h2>
            <Stagger className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <StaggerItem key={item.id}>
                  <ArticleCard post={item} locale={locale} readLabel={dict['common.readMore']} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <JsonLd data={structuredData} />
    </>
  );
}
