import Image from 'next/image';
import { Antenna, Hammer, Telescope, GalleryHorizontal } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { ScienceFigure, type FigureName } from '@/components/meridian/journal/figures';
import { LabExplorer, type LabExplorerChapter } from '@/components/meridian/labs/lab-explorer';
import type { Hotspot } from '@/components/meridian/labs/hotspot-plate';
import { Reveal } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { HomePendulum } from '@/components/meridian/sections/home/home-pendulum';
import { FallbackNotice } from '@/components/meridian/states/states';
import { EditorialHero } from './editorial-hero';
import type { ContentPageData } from './types';

type LabKey = 'physics' | 'chemistry' | 'biology' | 'mathematics' | 'electronics';

/*
 * Hotspot positions were placed by inspecting each archival photograph and
 * only mark things that are plainly visible in it (see the i18n notes).
 */
const LABS: Array<{ key: LabKey; photo: keyof typeof BRAND_PHOTOS; figure: FigureName; hotspots: Array<[number, number, keyof Dictionary]> }> = [
  {
    key: 'physics',
    photo: 'physicsLab',
    figure: 'pendulum',
    hotspots: [
      [26, 22, 'mx.labs.hs.physicsBoard'],
      [4, 82, 'mx.labs.hs.physicsCylinder'],
      [52, 72, 'mx.labs.hs.physicsBench'],
    ],
  },
  {
    key: 'chemistry',
    photo: 'chemistryLab',
    figure: 'ph',
    hotspots: [
      [54, 52, 'mx.labs.hs.chemBurette'],
      [82, 42, 'mx.labs.hs.chemShelf'],
      [77, 80, 'mx.labs.hs.chemFunnel'],
      [4, 84, 'mx.labs.hs.chemGas'],
    ],
  },
  {
    key: 'biology',
    photo: 'biologyLab',
    figure: 'cell',
    hotspots: [
      [45, 68, 'mx.labs.hs.bioSkeleton'],
      [63, 66, 'mx.labs.hs.bioTorso'],
      [25, 22, 'mx.labs.hs.bioCharts'],
      [86, 62, 'mx.labs.hs.bioShelves'],
    ],
  },
  {
    key: 'mathematics',
    photo: 'mathematicsLab',
    figure: 'pythagoras',
    hotspots: [
      [44, 52, 'mx.labs.hs.mathPoly'],
      [36, 66, 'mx.labs.hs.mathGlobe'],
      [63, 78, 'mx.labs.hs.mathSolids'],
    ],
  },
  {
    key: 'electronics',
    photo: 'electronicsLab',
    figure: 'gate',
    hotspots: [
      [55, 48, 'mx.labs.hs.elecBoards'],
      [84, 33, 'mx.labs.hs.elecCharts'],
      [6, 69, 'mx.labs.hs.elecRadio'],
      [40, 82, 'mx.labs.hs.elecBench'],
    ],
  },
];

/**
 * Laboratories & facilities (CMS path "infrastructure"): an exhibit walk
 * through the five laboratories, each with photo hotspots and a figure of
 * the principle its question leads to, then the rest of the campus as a
 * register of verified figures, the pendulum experiment, and the CMS text.
 */
export function LabsPage({ data }: { data: ContentPageData }) {
  const { dict, locale } = data;
  const chapters: LabExplorerChapter[] = LABS.map((lab, index) => ({
    key: lab.key,
    name: dict[`mx.story.labs.${lab.key}`],
    question: dict[`mx.story.labs.${lab.key}Q`],
    text: dict[`mx.story.labs.${lab.key}Text`],
    photo: BRAND_PHOTOS[lab.photo],
    hotspots: lab.hotspots.map(([x, y, key]): Hotspot => ({ x, y, text: dict[key] })),
    figure: <ScienceFigure name={lab.figure} dict={dict} number={index + 2} />,
  }));

  const register: Array<{ name: string; figure?: string; unit?: string; photo?: keyof typeof BRAND_PHOTOS; icon?: typeof Antenna }> = [
    { name: dict['mx.labs.f.museum'], figure: dict['mx.labs.f.museumFig'], unit: dict['mx.labs.f.museumUnit'], photo: 'scienceMuseum' },
    { name: dict['mx.labs.f.library'], figure: dict['mx.labs.f.libraryFig'], unit: dict['mx.labs.f.libraryUnit'], photo: 'library' },
    { name: dict['mx.labs.f.auditorium'], figure: dict['mx.labs.f.auditoriumFig'], unit: dict['mx.labs.f.auditoriumUnit'], photo: 'lectureHall' },
    { name: dict['mx.labs.f.openAir'], figure: dict['mx.labs.f.openAirFig'], unit: dict['mx.labs.f.openAirUnit'], photo: 'amphitheatreNight' },
  ];
  const minor = [
    { name: dict['mx.labs.f.tower'], icon: Telescope },
    { name: dict['mx.labs.f.ham'], icon: Antenna },
    { name: dict['mx.labs.f.workshop'], text: dict['mx.labs.f.workshopText'], icon: Hammer },
    { name: dict['mx.labs.f.gallery'], icon: GalleryHorizontal },
  ];

  return (
    <>
      <EditorialHero
        locale={locale}
        homeLabel={dict['page.breadcrumbHome']}
        breadcrumbLabel={dict['nav.breadcrumb']}
        crumbs={data.crumbs}
        eyebrow={dict['mx.story.labs.eyebrow']}
        title={dict['mx.story.labs.title']}
        accent={dict['mx.story.labs.titleAccent']}
        lede={dict['mx.home.facility.labs.text']}
        folio={[dict['mx.nav.labs'], dict['mx.nav.d.labs'], dict['mx.home.heroCoordinates']]}
        aside={
          <figure>
            <div className="mx-plate relative aspect-[4/5]">
              <Image src={BRAND_PHOTOS.biologyLabWorkshop} alt="" fill priority sizes="(min-width: 1024px) 30vw, 100vw" placeholder="blur" className="object-cover" />
              <span aria-hidden="true" className="mx-ticks" />
            </div>
            <figcaption className="mx-figcap">
              <span className="mx-figcap-num">{dict['mx.figure']} 01</span>
              <span>{dict['mx.home.captionLearning']}</span>
            </figcaption>
          </figure>
        }
      />

      <section aria-label={dict['mx.labs.chapterNav']} className="mx-surface-ivory mx-section">
        <div className="mx-container">
          {data.isFallback ? <FallbackNotice className="mb-10">{dict['page.notTranslated']}</FallbackNotice> : null}
          <LabExplorer
            chapters={chapters}
            labels={{
              nav: dict['mx.labs.chapterNav'],
              question: dict['mx.story.labs.question'],
              principle: dict['mx.labs.principle'],
              lookCloser: dict['mx.labs.lookCloser'],
              hint: dict['mx.labs.lookHint'],
              archival: dict['mx.labs.archival'],
            }}
          />
        </div>
      </section>

      <section aria-labelledby="labs-register" className="mx-surface-stone mx-grain mx-section">
        <div className="mx-container">
          <SectionHeading id="labs-register" eyebrow={dict['mx.labs.record']} title={dict['mx.labs.facilitiesTitle']} intro={dict['mx.labs.facilitiesIntro']} align="split" />
          <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {register.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.08} as="figure" className="min-w-0">
                {item.photo ? (
                  <div className={index % 2 ? 'mx-plate relative aspect-[4/5]' : 'mx-plate relative aspect-[4/3] lg:mt-16'}>
                    <Image src={BRAND_PHOTOS[item.photo]} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" placeholder="blur" className="object-cover" />
                    <span aria-hidden="true" className="mx-ticks" />
                  </div>
                ) : null}
                <figcaption className="mt-5 border-t border-(--mx-line-strong) pt-4">
                  <p className="mx-numeric text-[clamp(2.5rem,2rem+1.6vw,3.5rem)] leading-none">{item.figure}</p>
                  <p className="mt-2 text-[0.9375rem] text-(--mx-fg-2)">{item.unit}</p>
                  <p className="mx-mono-label mt-3">{item.name}</p>
                </figcaption>
              </Reveal>
            ))}
          </div>
          <ul className="mx-ledger mt-16 grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
            {minor.map(({ name, text, icon: Icon }) => (
              <li key={name} className="flex gap-4 py-5">
                <Icon className="mt-1 size-5 shrink-0 text-(--mx-accent-2)" aria-hidden="true" strokeWidth={1.4} />
                <span>
                  <span className="block font-semibold">{name}</span>
                  {text ? <span className="mt-1 block text-[0.875rem] text-(--mx-fg-2)">{text}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HomePendulum locale={locale} dict={dict} />

      {data.bodyHtml ? (
        <section aria-labelledby="labs-cms" className="mx-surface-ivory mx-section">
          <div className="mx-container-narrow">
            <p id="labs-cms" className="mx-eyebrow">
              {dict['mx.labs.record']}
            </p>
            <div className="mx-prose mx-prose-journal mt-6" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
          </div>
        </section>
      ) : null}
    </>
  );
}
