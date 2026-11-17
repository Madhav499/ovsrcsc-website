import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { PendulumLab } from '@/components/meridian/story/pendulum-lab';

/** Interactive physics bench that follows the Physics Laboratory chapter. */
export function HomePendulum({ locale, dict, index }: { locale: LocaleCode; dict: Dictionary; index: string }) {
  return (
    <section id="pendulum-lab" aria-labelledby="home-pendulum-title" className="mx-surface-white mx-section scroll-mt-[var(--mx-header-h)]">
      <div className="mx-container">
        <SectionHeading
          id="home-pendulum-title"
          index={index}
          eyebrow={dict['mx.story.pendulum.eyebrow']}
          title={dict['mx.story.pendulum.title']}
          accent={dict['mx.story.pendulum.titleAccent']}
          align="split"
          intro={<p>{dict['mx.story.pendulum.intro']}</p>}
        />
        <div className="mt-14">
          <PendulumLab
            locale={locale}
            labels={{
              figure: dict['mx.story.pendulum.figure'],
              length: dict['mx.story.pendulum.length'],
              angle: dict['mx.story.pendulum.angle'],
              gravity: dict['mx.story.pendulum.gravity'],
              mass: dict['mx.story.pendulum.mass'],
              bodies: {
                earth: dict['mx.story.pendulum.earth'],
                moon: dict['mx.story.pendulum.moon'],
                mars: dict['mx.story.pendulum.mars'],
                jupiter: dict['mx.story.pendulum.jupiter'],
              },
              light: dict['mx.story.pendulum.light'],
              heavy: dict['mx.story.pendulum.heavy'],
              play: dict['mx.story.pendulum.play'],
              pause: dict['mx.story.pendulum.pause'],
              period: dict['mx.story.pendulum.period'],
              periodHelp: dict['mx.story.pendulum.periodHelp'],
              perMinute: dict['mx.story.pendulum.perMinute'],
              massNote: dict['mx.story.pendulum.massNote'],
              formula: dict['mx.story.pendulum.formula'],
              dragHint: dict['mx.story.pendulum.dragHint'],
              largeAngle: dict['mx.story.pendulum.largeAngle'],
              seconds: dict['mx.story.pendulum.seconds'],
              metres: dict['mx.story.pendulum.metres'],
            }}
          />
        </div>
      </div>
    </section>
  );
}
