import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { CmsImage } from '@/components/meridian/media/cms-image';
import { Reveal, Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';

export interface FeaturedProgramme {
  id: string;
  path: string;
  title: string;
  summary: string;
  coverKey: string | null;
}

interface HomeExperiencesProps {
  locale: LocaleCode;
  dict: Dictionary;
  programmes: FeaturedProgramme[];
}

interface Facility {
  title: string;
  text: string;
  href: string;
  photos: StaticImageData[];
  className: string;
  imageClass: string;
}

export function HomeExperiences({ locale, dict, programmes }: HomeExperiencesProps) {
  const p = `/${locale}`;
  const facilities: Facility[] = [
    {
      title: dict['mx.home.facility.museum.title'],
      text: dict['mx.home.facility.museum.text'],
      href: `${p}/infrastructure`,
      photos: [BRAND_PHOTOS.scienceMuseum],
      className: 'md:col-span-6 lg:col-span-7 lg:row-span-2',
      imageClass: 'aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[34rem]',
    },
    {
      title: dict['mx.home.facility.labs.title'],
      text: dict['mx.home.facility.labs.text'],
      href: `${p}/infrastructure`,
      photos: [BRAND_PHOTOS.chemistryLab, BRAND_PHOTOS.physicsLab, BRAND_PHOTOS.biologyLab],
      className: 'md:col-span-6 lg:col-span-5',
      imageClass: 'aspect-[16/9]',
    },
    {
      title: dict['mx.home.facility.astronomy.title'],
      text: dict['mx.home.facility.astronomy.text'],
      href: `${p}/projects/big-bang-astronomy-club`,
      photos: [BRAND_PHOTOS.telescopes],
      className: 'md:col-span-6 lg:col-span-5',
      imageClass: 'aspect-[16/9]',
    },
    {
      title: dict['mx.home.facility.library.title'],
      text: dict['mx.home.facility.library.text'],
      href: `${p}/infrastructure`,
      photos: [BRAND_PHOTOS.library],
      className: 'md:col-span-6 lg:col-span-5',
      imageClass: 'aspect-[16/10]',
    },
    {
      title: dict['mx.home.facility.auditorium.title'],
      text: dict['mx.home.facility.auditorium.text'],
      href: `${p}/infrastructure`,
      photos: [BRAND_PHOTOS.lectureHall],
      className: 'md:col-span-12 lg:col-span-7',
      imageClass: 'aspect-[16/10] md:aspect-[21/9] lg:aspect-[16/8]',
    },
  ];

  const fallbackProgrammes = [
    { title: dict['home.flagship.safar'], text: dict['home.flagship.safarText'], href: `${p}/projects/vigyan-safar` },
    { title: dict['home.flagship.darshan'], text: dict['home.flagship.darshanText'], href: `${p}/projects/vigyan-darshan` },
    { title: dict['home.flagship.sss'], text: dict['home.flagship.sssText'], href: `${p}/projects/sunday-science-school` },
  ];

  return (
    <section aria-labelledby="home-experiences-title" className="mx-surface-navy mx-section relative isolate overflow-hidden">
      <div aria-hidden="true" className="mx-gridlines pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <div className="mx-container">
        <SectionHeading
          id="home-experiences-title"
          index="03"
          eyebrow={dict['mx.home.experiencesEyebrow']}
          title={dict['mx.home.experiencesTitle']}
          accent={dict['mx.home.experiencesTitleAccent']}
          align="split"
          intro={<p>{dict['mx.home.experiencesIntro']}</p>}
        />

        <div className="mt-16 grid gap-5 md:grid-cols-12 lg:gap-6">
          {facilities.map((facility, index) => (
            <Reveal key={facility.title} delay={(index % 2) * 0.08} className={cn('min-w-0', facility.className)}>
              <Link href={facility.href} className="group flex h-full flex-col">
                <div className={cn('mx-plate mx-zoom relative', facility.imageClass)}>
                  {facility.photos.length > 1 ? (
                    <div className="absolute inset-0 grid grid-cols-3 gap-0.5">
                      {facility.photos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="relative overflow-hidden">
                          <Image src={photo} alt="" fill placeholder="blur" sizes="(max-width: 768px) 33vw, 15vw" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Image
                      src={facility.photos[0]}
                      alt=""
                      fill
                      placeholder="blur"
                      sizes={index === 0 ? '(max-width: 768px) 100vw, 58vw' : '(max-width: 768px) 100vw, 42vw'}
                      className="object-cover"
                    />
                  )}
                  <span aria-hidden="true" className="mx-ticks" />
                  {index === 0 ? <div aria-hidden="true" className="mx-scrim absolute inset-0" /> : null}
                  {index === 0 ? (
                    <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-9">
                      <h3 className="mx-h3 text-(--mx-ivory)">{facility.title}</h3>
                      <p className="mt-3 max-w-md text-(--mx-fg-2)">{facility.text}</p>
                    </div>
                  ) : null}
                </div>
                {index !== 0 ? (
                  <div className="flex items-start justify-between gap-6 pt-5">
                    <div className="min-w-0">
                      <h3 className="mx-h4 transition-colors duration-300 group-hover:text-(--mx-cyan)">{facility.title}</h3>
                      <p className="mt-2 text-[0.9375rem] text-(--mx-fg-2)">{facility.text}</p>
                    </div>
                    <ArrowUpRight
                      className="mt-1 size-5 shrink-0 text-(--mx-fg-3) transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--mx-cyan)"
                      aria-hidden="true"
                    />
                  </div>
                ) : null}
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Programmes */}
        <div className="mt-24 border-t border-(--mx-line-strong) pt-12 lg:mt-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h3 className="mx-h3">{dict['mx.home.programmesTitle']}</h3>
            <Link href={`${p}/projects`} className="mx-link">
              {dict['mx.home.programmesAll']}
              <ArrowRight className="mx-btn-icon" aria-hidden="true" />
            </Link>
          </div>

          {programmes.length ? (
            <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" as="div">
              {programmes.slice(0, 4).map((programme, index) => (
                <StaggerItem key={programme.id}>
                  <Link href={`${p}/${programme.path}`} className="group flex h-full flex-col">
                    <div className="mx-plate mx-zoom relative aspect-[4/3]">
                      {programme.coverKey ? (
                        <CmsImage storageKey={programme.coverKey} alt="" sizes="(max-width: 640px) 100vw, 25vw" />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center bg-(--mx-navy-raised)">
                          <span className="mx-numeric text-6xl text-(--mx-fg-3)">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                    <p className="mx-mono-label mt-5">{String(index + 1).padStart(2, '0')}</p>
                    <h4 className="mx-h4 mt-2 transition-colors duration-300 group-hover:text-(--mx-cyan)">{programme.title}</h4>
                    {programme.summary ? (
                      <p className="mx-line-clamp-3 mt-2 text-[0.9375rem] text-(--mx-fg-2)">{programme.summary}</p>
                    ) : null}
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <ol className="mt-6">
              {fallbackProgrammes.map((programme, index) => (
                <li key={programme.href}>
                  <Link
                    href={programme.href}
                    className="group grid gap-3 border-b border-(--mx-line) py-8 md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-center md:gap-8"
                  >
                    <span className="mx-numeric text-4xl text-(--mx-fg-3) transition-colors duration-300 group-hover:text-(--mx-amber)">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h4 className="mx-h3 transition-colors duration-300 group-hover:text-(--mx-cyan)">{programme.title}</h4>
                    <p className="text-[0.9375rem] text-(--mx-fg-2)">{programme.text}</p>
                    <ArrowRight
                      className="hidden size-5 text-(--mx-fg-3) transition-transform duration-500 group-hover:translate-x-1 group-hover:text-(--mx-fg) md:block"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
