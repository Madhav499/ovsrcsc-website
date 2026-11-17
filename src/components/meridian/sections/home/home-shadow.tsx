import Image from 'next/image';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Reveal } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { ZeroShadowLab } from '@/components/meridian/story/zero-shadow-lab';

/** Noon over Rajkot: the Zero Shadow Day simulator beside the center's own 2022 photograph. */
export function HomeShadow({ locale, dict, index }: { locale: LocaleCode; dict: Dictionary; index: string }) {
  return (
    <section aria-labelledby="home-shadow-title" className="mx-surface-white mx-section pb-16 sm:pb-20">
      <div className="mx-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-8">
            <SectionHeading
              id="home-shadow-title"
              index={index}
              eyebrow={dict['mx.story.shadow.eyebrow']}
              title={dict['mx.story.shadow.title']}
              accent={dict['mx.story.shadow.titleAccent']}
              intro={<p>{dict['mx.story.shadow.intro']}</p>}
            />
          </div>
          <Reveal variant="mask" className="max-w-[18rem] lg:col-span-4 lg:justify-self-end">
            <figure>
              <div className="mx-plate relative aspect-[3/4]">
                <Image
                  src={BRAND_PHOTOS.skyWatch}
                  alt={dict['mx.home.discoveryCaption']}
                  fill
                  placeholder="blur"
                  sizes="(max-width: 1024px) 18rem, 20vw"
                  className="object-cover"
                />
                <span aria-hidden="true" className="mx-ticks" />
              </div>
              <figcaption className="mt-3 text-[0.8125rem] text-(--mx-fg-3)">
                <span className="mx-mono-label mr-2 text-(--mx-accent)">{dict['mx.figure']}</span>
                {dict['mx.home.discoveryCaption']}
              </figcaption>
            </figure>
          </Reveal>
        </div>
        <div className="mt-14">
          <ZeroShadowLab
            locale={locale}
            labels={{
              figure: dict['mx.story.shadow.figure'],
              date: dict['mx.story.shadow.date'],
              elevation: dict['mx.story.shadow.elevation'],
              length: dict['mx.story.shadow.length'],
              declination: dict['mx.story.shadow.declination'],
              north: dict['mx.story.shadow.north'],
              south: dict['mx.story.shadow.south'],
              none: dict['mx.story.shadow.none'],
              first: dict['mx.story.shadow.first'],
              second: dict['mx.story.shadow.second'],
              june: dict['mx.story.shadow.june'],
              december: dict['mx.story.shadow.december'],
              jumpTo: dict['mx.story.shadow.jumpTo'],
              note: dict['mx.story.shadow.note'],
              metres: dict['mx.story.pendulum.metres'],
              northShort: dict['mx.story.shadow.northShort'],
              southShort: dict['mx.story.shadow.southShort'],
            }}
          />
        </div>
      </div>
    </section>
  );
}
