import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { countWords } from '@/lib/sanitize';
import { indexLabel } from '@/lib/meridian/site';
import { repairText } from '@/lib/meridian/text';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Reveal } from '@/components/meridian/motion/reveal';
import { EmptyState, FallbackNotice } from '@/components/meridian/states/states';
import { EditorialHero } from './editorial-hero';
import type { ContentPageData } from './types';

/** Cover plate that reveals with a cinematic clip-path mask. */
export function CoverPlate({ storageKey, alt, caption, figureLabel }: { storageKey: string; alt: string; caption?: string; figureLabel: string }) {
  return (
    <Reveal variant="mask" as="figure" className="relative">
      <div className="mx-plate relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <CmsImage storageKey={storageKey} alt={alt} sizes="(max-width: 1408px) 100vw, 1408px" priority />
        <span aria-hidden="true" className="mx-ticks" />
      </div>
      {caption ? (
        <figcaption className="mx-figcap">
          <span className="mx-figcap-num">{figureLabel} 01</span>
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </Reveal>
  );
}

/** Ruled, numbered chapter list for child pages. */
export function ChapterLedger({ data, heading, start = 1 }: { data: ContentPageData; heading: string; start?: number }) {
  const p = `/${data.locale}`;
  return (
    <section aria-labelledby="page-chapters">
      <p className="mx-eyebrow">{data.dict['mx.page.chapters']}</p>
      <h2 id="page-chapters" className="mx-h3 mt-3">
        {heading}
      </h2>
      <ol className="mx-ledger mt-8">
        {data.children.map((child, index) => (
          <li key={child.id}>
            <Link href={`${p}/${child.path}`} className="group grid gap-4 py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)_9rem] sm:items-center sm:gap-8">
              <span className="mx-mono-label">{indexLabel(index + start)}</span>
              <span className="min-w-0">
                <span className="mx-h4 block transition-colors duration-300 group-hover:text-(--mx-accent)">{repairText(child.title)}</span>
                {child.summary ? (
                  <span className="mx-line-clamp-2 mt-1.5 block text-[0.9375rem] text-(--mx-fg-2)">{repairText(child.summary)}</span>
                ) : null}
              </span>
              {child.coverKey ? (
                <span className="mx-plate relative hidden aspect-[4/3] overflow-hidden sm:block">
                  <CmsImage storageKey={child.coverKey} alt="" sizes="9rem" className="transition-transform duration-700 group-hover:scale-105" />
                </span>
              ) : (
                <ArrowRight className="hidden size-5 justify-self-end text-(--mx-fg-3) transition-transform duration-300 group-hover:translate-x-1 sm:block" aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The default CMS page: a journal article. Stone opener with folio, wide
 * cover plate, a section rail beside readable prose (≤ 68ch), child
 * chapters, and previous / next continuation within the section.
 */
export function EditorialPage({
  data,
  afterBody,
  heroAside,
}: {
  data: ContentPageData;
  /** Extra page-specific content after the article (e.g. an exhibit). */
  afterBody?: ReactNode;
  heroAside?: ReactNode;
}) {
  const { dict, locale } = data;
  const p = `/${locale}`;
  const words = countWords(data.bodyHtml);
  const minutes = Math.max(1, Math.round(words / 200));
  // Siblings arrive in the CMS's own order and include this page.
  const position = data.siblings.findIndex((sibling) => sibling.path === data.path);
  const previous = position > 0 ? data.siblings[position - 1] : undefined;
  const next = position >= 0 ? data.siblings[position + 1] : undefined;

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
        aside={heroAside}
        folio={[
          `${dict['mx.page.section']} · ${data.sectionLabel}`,
          `${dict['page.lastUpdated']} · ${formatDate(data.updatedAt, locale)}`,
          words > 60 ? `${minutes} ${dict['mx.page.readingTime']}` : null,
        ].filter(Boolean)}
        figure={data.coverKey ? <CoverPlate storageKey={data.coverKey} alt={data.title} figureLabel={dict['mx.figure']} caption={data.title} /> : undefined}
      />

      <div className="mx-surface-ivory">
        <div className="mx-container mx-section !pt-16 sm:!pt-24">
          <div className="grid gap-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[16rem_minmax(0,1fr)_12rem]">
            <aside className="min-w-0 lg:order-none">
              {data.siblings.length > 1 ? (
                <nav aria-labelledby="page-section-nav" className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
                  <p id="page-section-nav" className="mx-mono-label">
                    {dict['page.inSection']}
                  </p>
                  <ol className="mt-4 border-l border-(--mx-line)">
                    {data.siblings.map((sibling, index) => (
                      <li key={sibling.id}>
                        <Link
                          href={`${p}/${sibling.path}`}
                          aria-current={sibling.path === data.path ? 'page' : undefined}
                          className="-ml-px flex min-h-11 items-baseline gap-3 border-l border-transparent py-2 pl-4 text-[0.9375rem] text-(--mx-fg-2) transition-colors hover:border-(--mx-mark) hover:text-(--mx-fg) aria-[current=page]:border-(--mx-mark) aria-[current=page]:text-(--mx-fg)"
                        >
                          <span className="mx-mono-label w-5 shrink-0">{indexLabel(index + 1)}</span>
                          <span className="min-w-0">{repairText(sibling.title)}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}
            </aside>

            <article className="min-w-0">
              {data.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
              {data.bodyHtml ? (
                <div className="mx-prose mx-prose-journal" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
              ) : data.children.length === 0 ? (
                <EmptyState title={dict['common.noResults']} />
              ) : null}

              {data.children.length ? (
                <div className="mt-16 border-t border-(--mx-line-strong) pt-12">
                  <ChapterLedger data={data} heading={data.title} />
                </div>
              ) : null}


              {previous || next ? (
                <nav aria-label={dict['mx.page.continue']} className="mt-20 grid gap-px overflow-hidden rounded-(--mx-radius-md) border border-(--mx-line) bg-(--mx-line) sm:grid-cols-2">
                  {previous ? (
                    <Link href={`${p}/${previous.path}`} className="group bg-(--mx-bg) p-6 transition-colors hover:bg-(--mx-raised)">
                      <span className="mx-mono-label inline-flex items-center gap-2">
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                        {dict['mx.page.previous']}
                      </span>
                      <span className="mx-h4 mt-2 block">{repairText(previous.title)}</span>
                    </Link>
                  ) : (
                    <span className="hidden bg-(--mx-bg) sm:block" />
                  )}
                  {next ? (
                    <Link href={`${p}/${next.path}`} className="group bg-(--mx-bg) p-6 text-right transition-colors hover:bg-(--mx-raised)">
                      <span className="mx-mono-label inline-flex items-center gap-2">
                        {dict['mx.page.next']}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                      <span className="mx-h4 mt-2 block">{repairText(next.title)}</span>
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </article>

            <div className="hidden xl:block">
              <div className="sticky top-[calc(var(--mx-header-h)+2rem)] border-t border-(--mx-line-strong) pt-5">
                <p className="mx-h4">{dict['mx.page.askTitle']}</p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-(--mx-fg-2)">{dict['contact.intro']}</p>
                <Link href={`${p}/contact`} className="mx-link mt-4 text-[0.9375rem]">
                  {dict['nav.contact']}
                  <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          {afterBody ? <div className="mt-8">{afterBody}</div> : null}
        </div>
      </div>
    </>
  );
}
