import type { Dictionary } from '@/i18n';
import { ScienceFigure } from '@/components/meridian/journal/figures';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { TelescopeExhibit } from '@/components/meridian/exhibits/telescope-exhibit';

/**
 * Big Bang Astronomy Club page: an exhibit on how the club's most common
 * instrument works — an interactive Dobsonian reflector with labelled parts,
 * the Newtonian light path, the club's verified facts, and an orbit figure.
 */
export function AstronomyExhibit({ dict }: { dict: Dictionary }) {
  const facts = [
    dict['mx.story.field.founded'],
    dict['mx.story.field.telescopes'],
    dict['mx.story.field.outreach'],
    dict['mx.story.field.starParty'],
  ];
  return (
    <section aria-labelledby="astro-exhibit" className="mt-16 border-t border-(--mx-line-strong) pt-14 sm:mt-24">
      <SectionHeading
        id="astro-exhibit"
        eyebrow={dict['mx.astro.eyebrow']}
        title={dict['mx.astro.title']}
        accent={dict['mx.astro.titleAccent']}
        align="split"
        intro={<p>{dict['mx.astro.intro']}</p>}
      />
      <div className="mt-10">
        <TelescopeExhibit
          labels={{
            label: dict['mx.astro.title'],
            hint: dict['mx.story.atom.hint'],
            rotateLeft: dict['mx.story.atom.rotateLeft'],
            rotateRight: dict['mx.story.atom.rotateRight'],
            note: dict['mx.astro.modelNote'],
            altitude: dict['mx.tel.altitude'],
            altitudeHelp: dict['mx.tel.altitudeHelp'],
            xray: dict['mx.tel.xray'],
            loading: dict['mx.tel.loading'],
            staticNote: dict['mx.tel.static'],
            load: dict['mx.tel.load'],
            parts: {
              aperture: { title: dict['mx.tel.aperture'], text: dict['mx.tel.apertureText'] },
              primary: { title: dict['mx.tel.primary'], text: dict['mx.tel.primaryText'] },
              secondary: { title: dict['mx.tel.secondary'], text: dict['mx.tel.secondaryText'] },
              eyepiece: { title: dict['mx.tel.eyepiece'], text: dict['mx.tel.eyepieceText'] },
              finder: { title: dict['mx.tel.finder'], text: dict['mx.tel.finderText'] },
              mount: { title: dict['mx.tel.mount'], text: dict['mx.tel.mountText'] },
            },
          }}
        />
      </div>
      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <ScienceFigure name="newtonian" dict={dict} number={2} />
        <ScienceFigure name="kepler" dict={dict} number={3} />
      </div>
      <div className="mt-14">
        <p className="mx-mono-label">{dict['mx.astro.factsTitle']}</p>
        <ul className="mx-ledger mt-4 grid sm:grid-cols-2 sm:gap-x-10">
          {facts.map((fact, index) => (
            <li key={fact} className="flex gap-4 py-4 text-[0.9375rem] text-(--mx-fg-2)">
              <span className="mx-mono-label shrink-0 pt-0.5">{String(index + 1).padStart(2, '0')}</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
