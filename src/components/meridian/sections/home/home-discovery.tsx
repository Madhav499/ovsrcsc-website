import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { Parallax } from '@/components/meridian/motion/parallax';
import { Reveal } from '@/components/meridian/motion/reveal';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

/** Immersive "beyond the classroom" composition built from verified field photography. */
export function HomeDiscovery({ locale, dict }: { locale: LocaleCode; dict: Dictionary }) {
  return (
    <section aria-labelledby="home-discovery-title" className="mx-surface-dark relative isolate overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <Parallax strength={120} className="absolute -inset-y-20 inset-x-0">
          <Image
            src={BRAND_PHOTOS.amphitheatreNight}
            alt=""
            fill
            placeholder="blur"
            sizes="100vw"
            className="object-cover opacity-35"
          />
        </Parallax>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--mx-midnight)_8%,rgb(16_28_44/0.82)_45%,rgb(16_28_44/0.55))]" />
        <div className="mx-starfield absolute inset-0 opacity-70" />
      </div>
      <OrbitMotif
        variant="meridian"
        className="pointer-events-none absolute -left-40 top-1/2 -z-10 w-[44rem] -translate-y-1/2 text-(--mx-ivory) opacity-20"
      />

      <div className="mx-container mx-section grid gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="mx-eyebrow">
            <span className="mx-eyebrow-index">05</span>
            <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" />
            {dict['mx.home.discoveryEyebrow']}
          </p>
          <h2 id="home-discovery-title" className="mx-display mt-6 max-w-[11ch]" style={{ fontSize: 'clamp(2.5rem, 1.3rem + 4.6vw, 5.75rem)' }}>
            {dict['mx.home.discoveryTitle']}{' '}
            <span className="mx-serif-accent text-(--mx-cyan)">{dict['mx.home.discoveryTitleAccent']}</span>
          </h2>
          <Reveal>
            <p className="mx-body-lg mt-8 max-w-lg">{dict['mx.home.discoveryBody']}</p>
          </Reveal>
          <Link href={`/${locale}/projects/big-bang-astronomy-club`} className="mx-btn mx-btn-light mt-10">
            {dict['mx.home.discoveryCta']}
            <ArrowRight className="mx-btn-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative lg:col-span-7">
          <div className="grid grid-cols-12 gap-4 sm:gap-5">
            <Reveal variant="mask" className="col-span-7 self-end">
              <figure>
                <div className="mx-plate relative aspect-[3/4]">
                  <Image src={BRAND_PHOTOS.skyWatch} alt={dict['mx.home.discoveryCaption']} fill placeholder="blur" sizes="(max-width: 1024px) 58vw, 32vw" className="object-cover" />
                  <span aria-hidden="true" className="mx-ticks" />
                </div>
                <figcaption className="mt-3 flex gap-3 text-[0.8125rem] text-(--mx-fg-3)">
                  <span className="mx-mono-label text-(--mx-cyan)">{dict['mx.figure']} 03</span>
                  {dict['mx.home.discoveryCaption']}
                </figcaption>
              </figure>
            </Reveal>
            <div className="col-span-5 grid gap-4 sm:gap-5">
              <Reveal delay={0.12} variant="mask">
                <figure>
                  <div className="mx-plate relative aspect-square">
                    <Image src={BRAND_PHOTOS.telescopeSession} alt={dict['mx.home.discoveryCaption2']} fill placeholder="blur" sizes="(max-width: 1024px) 42vw, 22vw" className="object-cover" />
                  </div>
                  <figcaption className="mt-3 text-[0.8125rem] leading-snug text-(--mx-fg-3)">
                    <span className="mx-mono-label mr-2 text-(--mx-cyan)">{dict['mx.figure']} 04</span>
                    {dict['mx.home.discoveryCaption2']}
                  </figcaption>
                </figure>
              </Reveal>
              <Reveal delay={0.24} variant="mask">
                <div className="mx-plate relative aspect-[4/3]">
                  <Image src={BRAND_PHOTOS.solarEclipse} alt="" fill placeholder="blur" sizes="(max-width: 1024px) 42vw, 22vw" className="object-cover" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
