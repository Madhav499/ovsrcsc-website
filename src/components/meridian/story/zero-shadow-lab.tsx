'use client';

import { useId, useMemo, useState } from 'react';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatFixed, NUMBER_TAG } from './format';

/** Rajkot's latitude in degrees north. */
const LATITUDE = 22.3;
const DAYS = 365;
const JUNE_SOLSTICE = 172;
const DECEMBER_SOLSTICE = 355;

/** Solar declination (degrees) for day-of-year N — Cooper's approximation. */
function declination(day: number) {
  return 23.44 * Math.sin((2 * Math.PI * (284 + day)) / DAYS);
}

/** Days on which the noon Sun comes closest to the zenith, one per half-year. */
function zeroShadowDays(): [number, number] {
  let first = 1;
  let second = JUNE_SOLSTICE;
  for (let day = 1; day <= DAYS; day += 1) {
    const miss = Math.abs(LATITUDE - declination(day));
    if (day < JUNE_SOLSTICE) {
      if (miss < Math.abs(LATITUDE - declination(first))) first = day;
    } else if (miss < Math.abs(LATITUDE - declination(second))) {
      second = day;
    }
  }
  return [first, second];
}

export interface ZeroShadowLabels {
  figure: string;
  date: string;
  elevation: string;
  length: string;
  declination: string;
  north: string;
  south: string;
  none: string;
  first: string;
  second: string;
  june: string;
  december: string;
  jumpTo: string;
  note: string;
  metres: string;
  northShort: string;
  southShort: string;
}

const GROUND = 214;
const POLE_PX = 92; // 1 m
const BASE_X = 200;
const SUN_ORBIT = 168;

/**
 * Noon-Sun simulator for Rajkot. Choose a date and the diagram shows how
 * high the Sun climbs at local noon and how long a 1 m pole's shadow is.
 * All geometry is computed, not drawn by hand: zenith distance = φ − δ.
 */
export function ZeroShadowLab({ labels, locale }: { labels: ZeroShadowLabels; locale: LocaleCode }) {
  const id = useId();
  const [firstZero, secondZero] = useMemo(zeroShadowDays, []);
  const [day, setDay] = useState(firstZero);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(NUMBER_TAG[locale], { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    [locale],
  );
  const dateLabel = (value: number) => dateFormat.format(new Date(Date.UTC(2026, 0, value)));

  const delta = declination(day);
  const zenith = LATITUDE - delta; // > 0: Sun south of overhead
  const elevation = 90 - Math.abs(zenith);
  const isZero = day === firstZero || day === secondZero;
  const shadow = isZero ? 0 : Math.tan((Math.abs(zenith) * Math.PI) / 180);
  const direction = isZero ? labels.none : zenith > 0 ? labels.north : labels.south;

  // Diagram: South on the left, North on the right.
  const sunSide = zenith > 0 ? -1 : 1;
  const e = (elevation * Math.PI) / 180;
  const sunX = BASE_X + sunSide * SUN_ORBIT * Math.cos(e);
  const sunY = GROUND - SUN_ORBIT * Math.sin(e);
  const shadowPx = Math.min(185, shadow * POLE_PX);
  const tipX = BASE_X - sunSide * shadowPx;
  const num = (value: number, digits: number) => formatFixed(value, locale, digits);

  const jumps: Array<{ label: string; value: number }> = [
    { label: labels.first, value: firstZero },
    { label: labels.second, value: secondZero },
    { label: labels.june, value: JUNE_SOLSTICE },
    { label: labels.december, value: DECEMBER_SOLSTICE },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
      <figure className="lg:order-2 lg:col-span-7">
        <div className="mx-plate relative overflow-hidden bg-[linear-gradient(180deg,#cfe9f2_0%,#f6f3ec_78%)]">
          <svg viewBox="0 0 400 250" className="block w-full" role="img" aria-label={`${labels.figure}. ${dateLabel(day)}: ${labels.elevation} ${num(elevation, 1)}°, ${labels.length} ${num(shadow, 2)} ${labels.metres}. ${direction}.`}>
            <path
              d={`M ${BASE_X - SUN_ORBIT} ${GROUND} A ${SUN_ORBIT} ${SUN_ORBIT} 0 0 1 ${BASE_X + SUN_ORBIT} ${GROUND}`}
              fill="none"
              stroke="var(--mx-ink-3)"
              strokeWidth="1"
              strokeDasharray="2 6"
              opacity="0.5"
            />
            <line x1={BASE_X} y1={GROUND} x2={BASE_X} y2={GROUND - SUN_ORBIT - 10} stroke="var(--mx-ink-3)" strokeWidth="0.8" strokeDasharray="1 5" opacity="0.6" />
            {/* Sunlight grazing the top of the pole down to the shadow's tip */}
            {!isZero ? (
              <line x1={sunX} y1={sunY} x2={tipX} y2={GROUND} stroke="var(--mx-amber)" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.8" />
            ) : null}
            <rect x="0" y={GROUND} width="400" height={250 - GROUND} fill="#e3d8c0" />
            <line x1="0" y1={GROUND} x2="400" y2={GROUND} stroke="var(--mx-ink-2)" strokeWidth="1.2" />
            <line x1={BASE_X} y1={GROUND} x2={tipX} y2={GROUND} stroke="var(--mx-ink)" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
            <line x1={BASE_X} y1={GROUND} x2={BASE_X} y2={GROUND - POLE_PX} stroke="var(--mx-ink)" strokeWidth="4" strokeLinecap="round" />
            <circle cx={sunX} cy={sunY} r="22" fill="var(--mx-amber)" opacity="0.18" />
            <circle cx={sunX} cy={sunY} r="12" fill="var(--mx-amber)" />
            {isZero ? <circle cx={BASE_X} cy={GROUND} r="9" fill="none" stroke="var(--mx-teal-ink)" strokeWidth="2" /> : null}
            <text x="14" y={GROUND + 24} className="fill-(--mx-ink-2) text-[13px] font-bold">{labels.southShort}</text>
            <text x="386" y={GROUND + 24} textAnchor="end" className="fill-(--mx-ink-2) text-[13px] font-bold">{labels.northShort}</text>
          </svg>
          <span aria-hidden="true" className="mx-ticks" />
        </div>
        <figcaption className="mt-3 text-[0.8125rem] text-(--mx-fg-3)">
          <span className="mx-mono-label mr-2 text-(--mx-accent)">{labels.figure}</span>
        </figcaption>
      </figure>

      <div className="lg:order-1 lg:col-span-5">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={`${id}-day`} className="font-semibold text-(--mx-fg)">{labels.date}</label>
          <output htmlFor={`${id}-day`} className="mx-h4 text-(--mx-fg)">{dateLabel(day)}</output>
        </div>
        <input
          id={`${id}-day`}
          type="range"
          min={1}
          max={DAYS}
          step={1}
          value={day}
          aria-valuetext={dateLabel(day)}
          onChange={(event) => setDay(Number(event.target.value))}
          className="mt-2 h-11 w-full cursor-pointer accent-(--mx-amber-ink)"
        />

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-(--mx-radius-sm) border border-(--mx-line) bg-(--mx-line)" aria-live="polite">
          <div className="bg-(--mx-bg) p-4">
            <p className="mx-mono-label">{labels.elevation}</p>
            <p className="mx-numeric mt-2 text-[1.75rem] leading-none text-(--mx-fg)">{num(elevation, 1)}°</p>
          </div>
          <div className="bg-(--mx-bg) p-4">
            <p className="mx-mono-label">{labels.length}</p>
            <p className="mx-numeric mt-2 text-[1.75rem] leading-none text-(--mx-fg)">
              {num(shadow, 2)} <span className="text-[0.55em] text-(--mx-fg-3)">{labels.metres}</span>
            </p>
          </div>
          <div className="bg-(--mx-bg) p-4">
            <p className="mx-mono-label">{labels.declination}</p>
            <p className="mx-numeric mt-2 text-[1.25rem] leading-none text-(--mx-fg)">{num(delta, 1)}°</p>
          </div>
          <div className={cn('flex items-center p-4', isZero ? 'bg-(--mx-teal-ink) text-(--mx-white)' : 'bg-(--mx-bg) text-(--mx-fg)')}>
            <p className="font-semibold leading-snug">{direction}</p>
          </div>
        </div>

        <p className="mx-mono-label mt-6">{labels.jumpTo}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {jumps.map((jump) => (
            <button
              key={jump.label}
              type="button"
              aria-pressed={day === jump.value}
              onClick={() => setDay(jump.value)}
              className="mx-chip min-h-11"
            >
              {jump.label}
              <span className="text-[0.75rem] opacity-70">{dateLabel(jump.value)}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 text-[0.8125rem] leading-relaxed text-(--mx-fg-3)">{labels.note}</p>
      </div>
    </div>
  );
}
