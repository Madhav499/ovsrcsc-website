import type { Dictionary } from '@/i18n';
import type { LocaleCode } from '@/lib/constants';
import { ESTABLISHED_YEAR, formatNumber } from '@/lib/meridian/site';
import { CountUp } from '@/components/meridian/motion/count-up';
import { Stagger, StaggerItem } from '@/components/meridian/motion/reveal';
import { SectionHeading } from '@/components/meridian/primitives/section-heading';

interface Stat {
  value: number | null;
  display?: string;
  suffix?: string;
  label: string;
}

const NUMBER_LOCALE: Record<LocaleCode, string> = {
  en: 'en-IN',
  gu: 'gu-IN-u-nu-gujr',
  hi: 'hi-IN',
};

/**
 * Verified figures only — each is published on the center's own pages
 * (home, about, infrastructure and Sunday Science School pages).
 */
export function HomeGlance({ locale, dict }: { locale: LocaleCode; dict: Dictionary }) {
  const years = new Date().getFullYear() - ESTABLISHED_YEAR;
  const stats: Stat[] = [
    { value: years, label: dict['mx.home.stats.years'] },
    { value: 5, label: dict['home.stats.labs'] },
    { value: 50, suffix: '+', label: dict['home.stats.exhibits'] },
    { value: 6000, suffix: '+', label: dict['home.stats.books'] },
    {
      value: null,
      display: `${formatNumber(300, locale)}–${formatNumber(350, locale)}`,
      label: dict['home.stats.students'],
    },
    { value: 200, label: dict['mx.home.stats.auditorium'] },
  ];

  return (
    <section aria-labelledby="home-glance-title" className="mx-surface-white mx-section relative">
      <div className="mx-container">
        <SectionHeading
          id="home-glance-title"
          index="02"
          eyebrow={`${dict['mx.home.glanceEyebrow']} · ${dict['home.stats.established']} ${formatNumber(ESTABLISHED_YEAR, locale).replace(/,/g, '')}`}
          title={dict['mx.home.glanceTitle']}
          accent={dict['mx.home.glanceTitleAccent']}
          align="split"
          intro={<p>{dict['site.description']}</p>}
        />

        <Stagger className="mt-16 grid grid-cols-2 gap-px border-y border-(--mx-line-strong) bg-(--mx-line) lg:grid-cols-3" as="div">
          {stats.map((stat, index) => (
            <StaggerItem
              key={stat.label}
              className="relative bg-(--mx-bg) px-4 py-8 first:pl-0 sm:px-8 sm:py-12 [&:nth-child(odd)]:pl-0 lg:[&:nth-child(odd)]:pl-8 lg:[&:nth-child(3n+1)]:pl-0"
            >
              <span className="mx-mono-label">{String(index + 1).padStart(2, '0')}</span>
              <p className="mx-numeric mt-6 text-[clamp(2.4rem,1.6rem+3.6vw,5.25rem)] leading-none text-(--mx-fg)">
                {stat.value !== null ? (
                  <CountUp value={stat.value} suffix={stat.suffix} numberLocale={NUMBER_LOCALE[locale]} />
                ) : (
                  stat.display
                )}
              </p>
              <p className="mt-3 max-w-[22ch] text-[0.875rem] font-medium text-(--mx-fg-2) sm:mt-4 sm:text-[0.975rem]">{stat.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="mx-meta mt-6">{dict['mx.home.glanceNote']}</p>
      </div>
    </section>
  );
}
