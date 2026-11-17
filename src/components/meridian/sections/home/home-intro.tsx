import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Parallax } from '@/components/meridian/motion/parallax';
import { Reveal } from '@/components/meridian/motion/reveal';

export function HomeIntro({ locale, dict, index }: { locale: LocaleCode; dict: Dictionary; index: string }) {
  return (
    <section id="home-intro" aria-labelledby="home-intro-title" className="mx-surface-ivory mx-section relative overflow-hidden">
      <div className="mx-container grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="mx-eyebrow">
            <span className="mx-eyebrow-index">{index}</span>
            {dict['home.about.eyebrow']}
          </p>
          <h2 id="home-intro-title" className="mx-h2 mt-6 max-w-[14ch]">
            {dict['mx.home.introTitle']}{' '}
            <span className="mx-serif-accent text-(--mx-accent)">{dict['mx.home.introTitleAccent']}</span>
          </h2>
          <Reveal>
            <p className="mx-lede mt-8 max-w-xl text-(--mx-fg)">{dict['mx.home.introLede']}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 grid max-w-xl gap-5 text-(--mx-fg-2)">
              <p>{dict['home.about.body']}</p>
              <p>{dict['mx.home.introHistory']}</p>
            </div>
          </Reveal>
          <Link href={`/${locale}/about`} className="mx-btn mx-btn-ink mt-10">
            {dict['home.about.cta']}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative ml-auto w-full max-w-[44rem] sm:pb-32">
            <Reveal variant="mask">
              <figure>
                <div className="mx-plate relative aspect-[4/3]">
                  <Parallax strength={50} className="absolute -inset-y-8 inset-x-0">
                    <Image
                      src={BRAND_PHOTOS.biologyLabWorkshop}
                      alt={dict['mx.home.captionLearning']}
                      fill
                      placeholder="blur"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover"
                    />
                  </Parallax>
                  <span aria-hidden="true" className="mx-ticks" />
                </div>
                <figcaption className="mt-3 flex items-center gap-3 text-[0.8125rem] text-(--mx-fg-3)">
                  <span className="mx-mono-label text-(--mx-accent)">{dict['mx.figure']} 01</span>
                  {dict['mx.home.captionLearning']}
                </figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.15} className="relative z-10 mt-4 ml-auto mr-3 w-[72%] sm:absolute sm:bottom-0 sm:left-[-2.5rem] sm:mr-0 sm:mt-0 sm:w-[52%] lg:-left-16">
              <figure className="mx-surface-white rounded-(--mx-radius-sm) p-2 shadow-[var(--mx-shadow-lg)]">
                <div className="mx-plate relative aspect-[4/3]">
                  <Image
                    src={BRAND_PHOTOS.scienceMuseum}
                    alt={dict['mx.home.captionMuseum']}
                    fill
                    placeholder="blur"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="flex items-center gap-3 px-2 pb-1 pt-3 text-[0.8125rem] text-(--mx-fg-3)">
                  <span className="mx-mono-label text-(--mx-accent)">{dict['mx.figure']} 02</span>
                  <span className="sm:truncate">{dict['mx.home.captionMuseum']}</span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="mx-container mt-20 lg:mt-28">
        <Reveal>
          <figure className="mx-auto max-w-4xl border-t border-(--mx-line-strong) pt-10 text-center">
            <blockquote className="mx-lede !text-[clamp(1.5rem,1.1rem+1.6vw,2.4rem)] !leading-snug text-(--mx-fg)">
              “{dict['home.quote']}”
            </blockquote>
            <figcaption className="mx-mono-label mt-6">— {dict['home.quoteAuthor']}</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
