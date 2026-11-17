import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { BRAND_PHOTOS } from '@/components/meridian/media/brand-photos';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';
import { LabChapters, type LabChapter } from '@/components/meridian/story/lab-chapters';

const LABS = [
  { key: 'physics', photo: BRAND_PHOTOS.physicsLab },
  { key: 'chemistry', photo: BRAND_PHOTOS.chemistryLab },
  { key: 'biology', photo: BRAND_PHOTOS.biologyLab },
  { key: 'mathematics', photo: BRAND_PHOTOS.mathematicsLab },
  { key: 'electronics', photo: BRAND_PHOTOS.electronicsLab },
] as const;

/** The five laboratories (verified on the center's infrastructure page) as a pinned story. */
export function HomeLabs({ locale, dict, index }: { locale: LocaleCode; dict: Dictionary; index: string }) {
  const chapters: LabChapter[] = LABS.map(({ key, photo }) => ({
    key,
    photo,
    name: dict[`mx.story.labs.${key}`],
    question: dict[`mx.story.labs.${key}Q`],
    text: dict[`mx.story.labs.${key}Text`],
    action: key === 'physics' ? { href: '#pendulum-lab', label: dict['mx.story.labs.try'] } : undefined,
  }));

  return (
    <section aria-labelledby="home-labs-title" className="mx-surface-ivory mx-section relative">
      <div className="mx-container">
        <SectionHeading
          id="home-labs-title"
          index={index}
          eyebrow={dict['mx.story.labs.eyebrow']}
          title={dict['mx.story.labs.title']}
          accent={dict['mx.story.labs.titleAccent']}
          align="split"
          intro={
            <>
              <p>{dict['mx.home.facility.labs.text']}</p>
              <p className="mt-4">{dict['mx.story.labs.intro']}</p>
            </>
          }
        />
        <div className="mt-16 lg:mt-20">
          <LabChapters
            chapters={chapters}
            allHref={`/${locale}/infrastructure`}
            labels={{ question: dict['mx.story.labs.question'], figure: dict['mx.figure'], all: dict['mx.story.labs.all'] }}
          />
        </div>
      </div>
    </section>
  );
}
