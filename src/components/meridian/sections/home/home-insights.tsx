import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { ArticleCard, type ArticleSummary } from '@/components/meridian/cards/article-card';
import { Reveal, Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';

interface HomeInsightsProps {
  locale: LocaleCode;
  dict: Dictionary;
  posts: ArticleSummary[];
}

/** Latest activity-blog posts: one featured story plus supporting stories. */
export function HomeInsights({ locale, dict, posts }: HomeInsightsProps) {
  if (!posts.length) return null;
  const [featured, ...rest] = posts;
  return (
    <section aria-labelledby="home-insights-title" className="mx-surface-white mx-section">
      <div className="mx-container">
        <SectionHeading
          id="home-insights-title"
          index="06"
          eyebrow={dict['mx.home.insightsEyebrow']}
          title={dict['mx.home.insightsTitle']}
          accent={dict['mx.home.insightsTitleAccent']}
          align="split"
          intro={<p>{dict['blog.intro']}</p>}
          action={
            <Link href={`/${locale}/blog`} className="mx-link">
              {dict['mx.home.insightsCta']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
          }
        />
        <Reveal className="mt-16">
          <ArticleCard post={featured} locale={locale} readLabel={dict['common.readMore']} variant="feature" />
        </Reveal>
        {rest.length ? (
          <Stagger className="mt-16 grid gap-x-8 gap-y-12 border-t border-(--mx-line) pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(0, 3).map((post) => (
              <StaggerItem key={post.slug}>
                <ArticleCard post={post} locale={locale} readLabel={dict['common.readMore']} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : null}
      </div>
    </section>
  );
}
