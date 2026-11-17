import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { NightJourney } from '@/components/meridian/story/night-journey';

/**
 * "Beyond the classroom": the light fades from noon to night, then the Big
 * Bang Astronomy Club's work unfolds as a horizontal sequence. Every caption
 * and fact comes from the center's own media library and club page.
 */
export function HomeDiscovery({ locale, dict, index }: { locale: LocaleCode; dict: Dictionary; index: string }) {
  return (
    <section aria-labelledby="home-discovery-title" className="mx-surface-dark relative isolate">
      <NightJourney
        dusk={dict['mx.story.field.dusk']}
        hint={dict['mx.story.field.hint']}
        figureLabel={dict['mx.figure']}
        closing={dict['mx.story.field.outreach']}
        cta={{ href: `/${locale}/projects/big-bang-astronomy-club`, label: dict['mx.home.discoveryCta'] }}
        panels={[
          {
            key: 'telescopes',
            photo: BRAND_PHOTOS.telescopes,
            caption: dict['mx.home.heroPlateCaption'],
            fact: dict['mx.story.field.telescopes'],
          },
          {
            key: 'eclipse',
            photo: BRAND_PHOTOS.solarEclipse,
            caption: dict['mx.story.field.captionEclipse'],
            fact: dict['mx.story.field.founded'],
          },
          {
            key: 'star-party',
            photo: BRAND_PHOTOS.telescopeSession,
            caption: dict['mx.home.discoveryCaption2'],
            fact: dict['mx.story.field.starParty'],
          },
        ]}
        intro={
          <>
            <p className="mx-eyebrow">
              <span className="mx-eyebrow-index">{index}</span>
              <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" />
              {dict['mx.home.discoveryEyebrow']}
            </p>
            <h2 id="home-discovery-title" className="mx-display mt-6 max-w-[11ch]" style={{ fontSize: 'clamp(2.5rem, 1.3rem + 4vw, 5.25rem)' }}>
              {dict['mx.home.discoveryTitle']}{' '}
              <span className="mx-serif-accent text-(--mx-cyan)">{dict['mx.home.discoveryTitleAccent']}</span>
            </h2>
            <p className="mx-body-lg mt-8 max-w-lg">{dict['mx.home.discoveryBody']}</p>
          </>
        }
      />
    </section>
  );
}
