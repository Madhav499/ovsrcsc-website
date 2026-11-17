import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { indexLabel } from '@/lib/meridian/site';
import { repairText } from '@/lib/meridian/text';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Reveal } from '@/components/meridian/motion/reveal';
import { FallbackNotice, EmptyState } from '@/components/meridian/states/states';
import { EditorialHero } from './editorial-hero';
import type { ContentPageData } from './types';

/*
 * Mosaic rhythm on large screens: a repeating, deliberately uneven sequence
 * of spans and proportions so the index reads like a magazine spread rather
 * than a card grid. Mobile gets a single column with the same proportions.
 */
const RHYTHM = [
  { span: 'lg:col-span-5', ratio: 'aspect-[4/5]', offset: '' },
  { span: 'lg:col-span-7', ratio: 'aspect-[16/10]', offset: 'lg:mt-24' },
  { span: 'lg:col-span-4', ratio: 'aspect-[1/1]', offset: '' },
  { span: 'lg:col-span-4', ratio: 'aspect-[3/4]', offset: 'lg:mt-16' },
  { span: 'lg:col-span-4', ratio: 'aspect-[4/3]', offset: 'lg:mt-6' },
];

/**
 * Programmes and Activities (CMS paths "projects" and "activities"): a
 * discovery page. The first chapter is a featured spread; the rest follow
 * in an editorial mosaic, with a numbered index for direct access.
 * Categories are not invented — the CMS does not record any.
 */
export function DiscoveryPage({ data }: { data: ContentPageData }) {
  const { dict, locale } = data;
  const p = `/${locale}`;
  const [featured, ...rest] = data.children;

  return (
    <>
      <EditorialHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={data.crumbs}
        eyebrow={data.sectionLabel}
        title={data.title}
        lede={data.summary}
        folio={[`${dict['mx.discovery.index']} · ${data.children.length} ${dict['mx.discovery.count']}`, dict['mx.brand.familiar']]}
        aside={
          data.children.length ? (
            <nav aria-label={dict['mx.discovery.index']} className="border-t border-(--mx-line-strong) pt-4">
              <p className="mx-mono-label">{dict['mx.discovery.index']}</p>
              <ol className="mt-3 grid">
                {data.children.map((child, index) => (
                  <li key={child.id}>
                    <a href={`#entry-${child.id}`} className="group flex min-h-10 items-baseline gap-3 py-1 text-[0.9375rem] text-(--mx-fg-2) hover:text-(--mx-fg)">
                      <span className="mx-mono-label w-5 shrink-0">{indexLabel(index + 1)}</span>
                      <span className="min-w-0 transition-transform duration-300 group-hover:translate-x-1">{repairText(child.title)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : undefined
        }
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-16">
          {data.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
          {data.bodyHtml ? <div className="mx-prose mx-prose-journal max-w-3xl" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} /> : null}

          {featured ? (
            <Reveal as="article" className="mt-16 sm:mt-20">
              <Link id={`entry-${featured.id}`} href={`${p}/${featured.path}`} className="group grid scroll-mt-32 gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
                <div className="mx-plate relative aspect-[16/10] overflow-hidden lg:col-span-8">
                  {featured.coverKey ? (
                    <CmsImage storageKey={featured.coverKey} alt="" sizes="(min-width: 1024px) 60vw, 100vw" className="transition-transform duration-[1400ms] ease-(--mx-ease-out) group-hover:scale-[1.03]" />
                  ) : null}
                  <span aria-hidden="true" className="mx-ticks" />
                </div>
                <div className="lg:col-span-4 lg:pb-4">
                  <p className="mx-eyebrow">
                    <span className="mx-eyebrow-index">01</span>
                    {dict['mx.discovery.featured']}
                  </p>
                  <h2 className="mx-h2 mt-5 transition-colors group-hover:text-(--mx-accent)">{repairText(featured.title)}</h2>
                  {featured.summary ? <p className="mt-5 text-(--mx-fg-2)">{repairText(featured.summary)}</p> : null}
                  <span className="mx-link mt-7">
                    {dict['common.learnMore']}
                    <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ) : (
            <EmptyState className="mt-14" title={dict['common.noResults']} />
          )}

          {rest.length ? (
            <div className="mt-24 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-12">
              {rest.map((child, index) => {
                const look = RHYTHM[index % RHYTHM.length];
                return (
                  <Reveal key={child.id} as="article" delay={(index % 3) * 0.06} className={cn('min-w-0', look.span, look.offset)}>
                    <Link id={`entry-${child.id}`} href={`${p}/${child.path}`} className="group block scroll-mt-32">
                      {child.coverKey ? (
                        <div className={cn('mx-plate relative overflow-hidden', look.ratio)}>
                          <CmsImage storageKey={child.coverKey} alt="" sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" className="transition-transform duration-[1200ms] ease-(--mx-ease-out) group-hover:scale-[1.04]" />
                          <span aria-hidden="true" className="mx-ticks" />
                        </div>
                      ) : (
                        <div className={cn('mx-surface-stone mx-grain relative grid place-items-end overflow-hidden rounded-(--mx-radius-xs) p-6', look.ratio)}>
                          <span aria-hidden="true" className="mx-numeric absolute right-5 top-2 text-[7rem] leading-none text-(--mx-fg) opacity-10">
                            {indexLabel(index + 2)}
                          </span>
                          <span className="mx-scale w-full" aria-hidden="true" />
                        </div>
                      )}
                      <div className="mt-5 flex items-baseline gap-4">
                        <span className="mx-mono-label shrink-0">{indexLabel(index + 2)}</span>
                        <div className="min-w-0">
                          <h3 className="mx-h4 transition-colors group-hover:text-(--mx-accent)">{repairText(child.title)}</h3>
                          {child.summary ? <p className="mx-line-clamp-3 mt-2 text-[0.9375rem] text-(--mx-fg-2)">{repairText(child.summary)}</p> : null}
                        </div>
                        <ArrowUpRight className="ml-auto size-4 shrink-0 text-(--mx-fg-3) transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
