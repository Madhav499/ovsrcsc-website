import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Parallax } from '@/components/meridian/motion/parallax';
import { Reveal } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { MilestoneTimeline } from '@/components/meridian/story/milestone-timeline';
import { FallbackNotice } from '@/components/meridian/states/states';
import { ScienceFigure } from '@/components/meridian/journal/figures';
import { ChapterLedger } from './editorial-page';
import { EditorialHero } from './editorial-hero';
import type { ContentPageData } from './types';

const MILESTONES = ['1979', '1982', '1991', '1997', '2003', '2008', '2017', '2020'] as const;

/**
 * About (CMS path "about"): the institutional story. The CMS article is the
 * primary text; around it sit the verified milestones (drawn rail), the
 * facilities that answer "what the center offers", and the chapters.
 */
export function AboutPage({ data }: { data: ContentPageData }) {
  const { dict, locale } = data;
  const p = `/${locale}`;
  const offers = [
    { title: dict['mx.home.facility.museum.title'], text: dict['mx.home.facility.museum.text'], photo: BRAND_PHOTOS.scienceMuseum, href: `${p}/infrastructure` },
    { title: dict['mx.home.facility.labs.title'], text: dict['mx.home.facility.labs.text'], photo: BRAND_PHOTOS.chemistryLab, href: `${p}/infrastructure` },
    { title: dict['mx.home.facility.library.title'], text: dict['mx.home.facility.library.text'], photo: BRAND_PHOTOS.library, href: `${p}/infrastructure` },
    { title: dict['mx.home.facility.astronomy.title'], text: dict['mx.home.facility.astronomy.text'], photo: BRAND_PHOTOS.skyWatch, href: `${p}/projects/big-bang-astronomy-club` },
  ];

  return (
    <>
      <EditorialHero
        locale={locale}
        surface="mineral"
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={data.crumbs}
        eyebrow={data.sectionLabel}
        title={data.title}
        lede={data.summary}
        folio={[dict['mx.about.folio'], dict['mx.brand.affiliation'], dict['mx.home.heroCoordinates']]}
        aside={
          <figure>
            <div className="mx-plate relative aspect-[4/5] overflow-hidden">
              <Parallax strength={50} className="absolute -inset-y-8 inset-x-0">
                <Image src={BRAND_PHOTOS.centreFacade} alt={dict['mx.home.visitCaption']} fill priority sizes="(min-width: 1024px) 32vw, 100vw" placeholder="blur" className="object-cover" />
              </Parallax>
              <span aria-hidden="true" className="mx-ticks" />
            </div>
            <figcaption className="mx-figcap">
              <span className="mx-figcap-num">{dict['mx.figure']} 01</span>
              <span>{dict['mx.home.visitCaption']}</span>
            </figcaption>
          </figure>
        }
      />

      {/* The institution's own words (CMS) */}
      <section aria-label={data.title} className="mx-surface-ivory mx-section">
        <div className="mx-container grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
          <div className="min-w-0">
            <div className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
              <p className="mx-eyebrow">
                <span className="mx-eyebrow-index">01</span>
                {dict['mx.page.chapters']}
              </p>
              <p className="mx-h3 mt-5 max-w-[16ch]">{dict['mx.home.introTitle']} <span className="mx-serif-accent text-(--mx-accent)">{dict['mx.home.introTitleAccent']}</span></p>
              <ScienceFigure name="kepler" dict={dict} number={2} className="mt-10 hidden max-w-sm lg:block" />
            </div>
          </div>
          <article className="min-w-0">
            {data.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
            <div className="mx-prose mx-prose-journal" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
          </article>
        </div>
      </section>

      {/* Milestones */}
      <section aria-labelledby="about-timeline" className="mx-surface-stone mx-grain mx-section">
        <div className="mx-container grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--mx-header-h)+2rem)]">
              <SectionHeading
                id="about-timeline"
                index="02"
                eyebrow={dict['mx.story.timeline.title']}
                title={dict['mx.about.timelineTitle']}
                accent={dict['mx.about.timelineAccent']}
                intro={dict['mx.about.timelineIntro']}
              />
              <Reveal variant="mask" as="figure" className="mt-10 hidden lg:block">
                <div className="mx-plate relative aspect-[3/2]">
                  <Image src={BRAND_PHOTOS.solarEclipse} alt="" fill sizes="36vw" placeholder="blur" className="object-cover" />
                  <span aria-hidden="true" className="mx-ticks" />
                </div>
                <figcaption className="mx-figcap">
                  <span className="mx-figcap-num">{dict['mx.figure']} 03</span>
                  <span>{dict['mx.story.field.captionEclipse']}</span>
                </figcaption>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <MilestoneTimeline
              title={dict['mx.story.timeline.title']}
              items={MILESTONES.map((year) => ({ year, text: dict[`mx.story.timeline.${year}`] }))}
            />
          </div>
        </div>
      </section>

      {/* What the center offers */}
      <section aria-labelledby="about-offers" className="mx-surface-ivory mx-section">
        <div className="mx-container">
          <SectionHeading id="about-offers" index="03" eyebrow={dict['mx.home.experiencesEyebrow']} title={dict['mx.about.offerTitle']} accent={dict['mx.about.offerAccent']} align="split" intro={dict['mx.home.experiencesIntro']} />
          <div className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
            {offers.map((offer, index) => (
              <Reveal key={offer.title} delay={index * 0.07} className={index % 2 === 1 ? 'lg:mt-20' : undefined}>
                <Link href={offer.href} className="group block">
                  <div className="mx-plate relative aspect-[4/5] overflow-hidden">
                    <Image src={offer.photo} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 100vw" placeholder="blur" className="object-cover transition-transform duration-[1200ms] ease-(--mx-ease-out) group-hover:scale-[1.04]" />
                    <span aria-hidden="true" className="mx-ticks" />
                  </div>
                  <p className="mx-mono-label mt-5">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mx-h4 mt-2 transition-colors group-hover:text-(--mx-accent)">{offer.title}</h3>
                  <p className="mt-2 text-[0.9375rem] text-(--mx-fg-2)">{offer.text}</p>
                  <span className="mx-link mt-4 text-[0.875rem]">
                    {dict['common.learnMore']}
                    <ArrowRight className="mx-btn-icon" aria-hidden="true" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Chapters + supporters */}
      <section className="mx-surface-white mx-section">
        <div className="mx-container grid gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-20">
          {data.children.length ? <ChapterLedger data={data} heading={dict['mx.about.chaptersTitle']} /> : <span />}
          <aside className="border-t border-(--mx-line-strong) pt-6 lg:mt-14">
            <p className="mx-mono-label">{dict['mx.footer.partners']}</p>
            <ul className="mt-4 grid gap-3 text-[0.9375rem]">
              {[dict['mx.footer.sef'], dict['mx.footer.rmc'], dict['mx.footer.gujcost']].map((name) => (
                <li key={name} className="border-b border-(--mx-line) pb-3 font-semibold">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.875rem] leading-relaxed text-(--mx-fg-2)">{dict['mx.about.supporters']}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
