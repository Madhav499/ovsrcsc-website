'use client';

import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import type { LocaleCode } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatFixed } from './format';

type Body = 'earth' | 'moon' | 'mars' | 'jupiter';
type Mass = 'light' | 'heavy';

/** Surface gravity in m/s². */
const GRAVITY: Record<Body, number> = { earth: 9.81, moon: 1.62, mars: 3.71, jupiter: 24.79 };
const BODIES: Body[] = ['earth', 'moon', 'mars', 'jupiter'];

const PIVOT = { x: 200, y: 26 };
const PX_PER_M = 125;
const BOB_R: Record<Mass, number> = { light: 11, heavy: 19 };
const MAX_ANGLE = 60;

export interface PendulumLabels {
  figure: string;
  length: string;
  angle: string;
  gravity: string;
  mass: string;
  bodies: Record<Body, string>;
  light: string;
  heavy: string;
  play: string;
  pause: string;
  period: string;
  periodHelp: string;
  perMinute: string;
  massNote: string;
  formula: string;
  dragHint: string;
  largeAngle: string;
  seconds: string;
  metres: string;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * An interactive physics bench. The swing is integrated from the full
 * equation θ'' = −(g/L)·sin θ, so large angles behave like a real pendulum;
 * the readout shows the small-angle period the formula predicts. Frames are
 * written straight to the SVG through a ref — React only re-renders when a
 * control changes. The loop sleeps while the bench is off-screen.
 */
export function PendulumLab({ labels, locale }: { labels: PendulumLabels; locale: LocaleCode }) {
  const id = useId();
  const reduce = useReducedMotion();
  const [length, setLength] = useState(1);
  const [angle, setAngle] = useState(20);
  const [body, setBody] = useState<Body>('earth');
  const [mass, setMass] = useState<Mass>('light');
  const [massChanged, setMassChanged] = useState(false);
  const [playing, setPlaying] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const arm = useRef<SVGGElement>(null);
  const sim = useRef({ theta: toRad(20), omega: 0 });
  const params = useRef({ length: 1, g: GRAVITY.earth });
  const inView = useRef(false);
  const autoStarted = useRef(false);
  const dragging = useRef(false);

  params.current = { length, g: GRAVITY[body] };

  const draw = useCallback(() => {
    arm.current?.setAttribute('transform', `rotate(${(-sim.current.theta * 180) / Math.PI} ${PIVOT.x} ${PIVOT.y})`);
  }, []);

  const resetSwing = useCallback(
    (deg: number) => {
      sim.current = { theta: toRad(deg), omega: 0 };
      draw();
    },
    [draw],
  );

  // Start once the bench is first seen (never automatically under reduced motion).
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting && !autoStarted.current && !reduce) {
          autoStarted.current = true;
          setPlaying(true);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const elapsed = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!inView.current || dragging.current) return;
      const { length: L, g } = params.current;
      const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
      const dt = elapsed / steps;
      for (let i = 0; i < steps; i += 1) {
        sim.current.omega += -(g / L) * Math.sin(sim.current.theta) * dt;
        sim.current.theta += sim.current.omega * dt;
      }
      draw();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, draw]);

  useEffect(() => {
    draw();
  }, [draw, length, mass]);

  const onLength = (value: number) => {
    setLength(value);
    resetSwing(angle);
  };
  const onAngle = (value: number) => {
    setAngle(value);
    resetSwing(value);
  };
  const onBody = (value: Body) => {
    setBody(value);
    resetSwing(angle);
  };
  const onMass = (value: Mass) => {
    setMass(value);
    setMassChanged(true);
  };

  /* Drag the bob to choose the starting angle, release to let it swing. */
  const angleFromPointer = (event: PointerEvent<SVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return angle;
    const scale = 400 / box.width;
    const dx = (event.clientX - box.left) * scale - PIVOT.x;
    const dy = (event.clientY - box.top) * scale - PIVOT.y;
    const deg = (Math.atan2(dx, Math.max(dy, 1)) * 180) / Math.PI;
    return Math.round(Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, deg)));
  };
  const onBobDown = (event: PointerEvent<SVGGElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onBobMove = (event: PointerEvent<SVGGElement>) => {
    if (!dragging.current) return;
    const deg = angleFromPointer(event);
    sim.current = { theta: toRad(deg), omega: 0 };
    draw();
  };
  const onBobUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const deg = Math.round((sim.current.theta * 180) / Math.PI);
    setAngle(Math.max(5, Math.abs(deg)));
    setPlaying(true);
  };

  const g = GRAVITY[body];
  const period = 2 * Math.PI * Math.sqrt(length / g);
  const rodLength = length * PX_PER_M;
  const bobR = BOB_R[mass];
  const arcR = rodLength;
  const a = toRad(angle);
  const arcPath = `M ${PIVOT.x - arcR * Math.sin(a)} ${PIVOT.y + arcR * Math.cos(a)} A ${arcR} ${arcR} 0 0 0 ${PIVOT.x + arcR * Math.sin(a)} ${PIVOT.y + arcR * Math.cos(a)}`;
  const num = (value: number, digits: number) => formatFixed(value, locale, digits);

  return (
    <div ref={root} className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
      <figure className="lg:col-span-7">
        <div className="mx-plate relative overflow-hidden bg-(--mx-ivory) [background-image:linear-gradient(var(--mx-line)_1px,transparent_1px),linear-gradient(90deg,var(--mx-line)_1px,transparent_1px)] [background-size:2rem_2rem]">
          <svg
            ref={svg}
            viewBox="0 0 400 320"
            className="block w-full select-none"
            role="img"
            aria-label={`${labels.figure}: ${labels.length} ${num(length, 2)} ${labels.metres}, ${labels.gravity} ${labels.bodies[body]}, ${labels.period} ${num(period, 2)} ${labels.seconds}`}
          >
            <line x1="130" y1={PIVOT.y} x2="270" y2={PIVOT.y} stroke="var(--mx-ink)" strokeWidth="4" strokeLinecap="round" />
            <path d={arcPath} fill="none" stroke="var(--mx-teal)" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.8" />
            <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y + rodLength + 26} stroke="var(--mx-ink-3)" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
            <g
              ref={arm}
              className="cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={onBobDown}
              onPointerMove={onBobMove}
              onPointerUp={onBobUp}
              onPointerCancel={onBobUp}
            >
              <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y + rodLength} stroke="var(--mx-ink-2)" strokeWidth="1.6" />
              <circle cx={PIVOT.x} cy={PIVOT.y + rodLength} r={bobR + 14} fill="transparent" />
              <circle cx={PIVOT.x} cy={PIVOT.y + rodLength} r={bobR} fill={`url(#${id}-bob)`} stroke="var(--mx-amber-ink)" strokeWidth="1" />
            </g>
            <circle cx={PIVOT.x} cy={PIVOT.y} r="4.5" fill="var(--mx-ink)" />
            <defs>
              <radialGradient id={`${id}-bob`} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#fff3dc" />
                <stop offset="55%" stopColor="var(--mx-amber)" />
                <stop offset="100%" stopColor="var(--mx-amber-ink)" />
              </radialGradient>
            </defs>
          </svg>
          <span aria-hidden="true" className="mx-ticks" />
        </div>
        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[0.8125rem] text-(--mx-fg-3)">
          <span>
            <span className="mx-mono-label mr-2 text-(--mx-accent)">{labels.figure}</span>
            {labels.dragHint}
          </span>
          <span className="mx-mono-label">{labels.formula}</span>
        </figcaption>
      </figure>

      <div className="lg:col-span-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-(--mx-radius-sm) border border-(--mx-line) bg-(--mx-line)">
          <div className="bg-(--mx-bg) p-5">
            <p className="mx-mono-label">{labels.period}</p>
            <p className="mx-numeric mt-3 text-[clamp(2rem,1.5rem+2vw,3rem)] leading-none text-(--mx-fg)" aria-live="polite">
              {num(period, 2)}
              <span className="ml-1 text-[0.45em] text-(--mx-fg-3)">{labels.seconds}</span>
            </p>
            <p className="mt-2 text-[0.8125rem] text-(--mx-fg-3)">{labels.periodHelp}</p>
          </div>
          <div className="bg-(--mx-bg) p-5">
            <p className="mx-mono-label">{labels.perMinute}</p>
            <p className="mx-numeric mt-3 text-[clamp(2rem,1.5rem+2vw,3rem)] leading-none text-(--mx-fg)">{num(60 / period, 1)}</p>
          </div>
        </div>
        <p className={cn('mt-3 min-h-[1.5rem] text-[0.875rem] font-medium text-(--mx-accent)', !massChanged && 'invisible')} aria-live="polite">
          {massChanged ? labels.massNote : ''}
        </p>

        <div className="mt-5 grid gap-6">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={`${id}-length`} className="font-semibold text-(--mx-fg)">{labels.length}</label>
              <output htmlFor={`${id}-length`} className="mx-numeric text-(--mx-fg-2)">
                {num(length, 2)} {labels.metres}
              </output>
            </div>
            <input
              id={`${id}-length`}
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={length}
              onChange={(event) => onLength(Number(event.target.value))}
              className="mt-2 h-11 w-full cursor-pointer accent-(--mx-teal-ink)"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={`${id}-angle`} className="font-semibold text-(--mx-fg)">{labels.angle}</label>
              <output htmlFor={`${id}-angle`} className="mx-numeric text-(--mx-fg-2)">{num(angle, 0)}°</output>
            </div>
            <input
              id={`${id}-angle`}
              type="range"
              min={5}
              max={MAX_ANGLE}
              step={1}
              value={angle}
              onChange={(event) => onAngle(Number(event.target.value))}
              className="mt-2 h-11 w-full cursor-pointer accent-(--mx-teal-ink)"
            />
            {angle > 25 ? <p className="mt-1 text-[0.8125rem] text-(--mx-fg-3)">{labels.largeAngle}</p> : null}
          </div>

          <fieldset>
            <legend className="font-semibold text-(--mx-fg)">{labels.gravity}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {BODIES.map((option) => (
                <label key={option} className="mx-chip min-h-11 cursor-pointer has-[:checked]:border-(--mx-fg) has-[:checked]:bg-(--mx-fg) has-[:checked]:text-(--mx-bg) has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--mx-focus)">
                  <input type="radio" name={`${id}-body`} value={option} checked={body === option} onChange={() => onBody(option)} className="sr-only" />
                  {labels.bodies[option]}
                  <span className="mx-numeric text-[0.75rem] opacity-70">{num(GRAVITY[option], 2)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-semibold text-(--mx-fg)">{labels.mass}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['light', 'heavy'] as const).map((option) => (
                <label key={option} className="mx-chip min-h-11 cursor-pointer has-[:checked]:border-(--mx-fg) has-[:checked]:bg-(--mx-fg) has-[:checked]:text-(--mx-bg) has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--mx-focus)">
                  <input type="radio" name={`${id}-mass`} value={option} checked={mass === option} onChange={() => onMass(option)} className="sr-only" />
                  <span aria-hidden="true" className={cn('rounded-full bg-(--mx-amber)', option === 'light' ? 'size-2' : 'size-3.5')} />
                  {option === 'light' ? labels.light : labels.heavy}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => {
              if (!playing) resetSwing(angle);
              setPlaying((value) => !value);
            }}
            className="mx-btn mx-btn-ink self-start"
            aria-pressed={playing}
          >
            {playing ? <Pause className="mx-btn-icon" aria-hidden="true" /> : <Play className="mx-btn-icon" aria-hidden="true" />}
            {playing ? labels.pause : labels.play}
          </button>
        </div>
      </div>
    </div>
  );
}
