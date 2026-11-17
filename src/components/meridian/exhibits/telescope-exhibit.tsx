'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { Box, RotateCcw, RotateCw } from 'lucide-react';
import { Component, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import poster from '@/assets/meridian/models/dobsonian-poster.png';
import { cn } from '@/lib/utils';
import { detectCapability, type Capability } from '@/components/meridian/visualizations/atom-stage';
import type { TelescopePart, TelescopeSceneState } from './telescope-scene';

const TelescopeScene = dynamic(() => import('./telescope-scene'), { ssr: false, loading: () => null });

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const PARTS: TelescopePart[] = ['aperture', 'primary', 'secondary', 'eyepiece', 'finder', 'mount'];
const STEP = Math.PI / 6;

export interface TelescopeExhibitLabels {
  label: string;
  hint: string;
  rotateLeft: string;
  rotateRight: string;
  note: string;
  parts: Record<TelescopePart, { title: string; text: string }>;
  altitude?: string;
  altitudeHelp?: string;
  xray?: string;
  loading?: string;
  staticNote?: string;
  load?: string;
}

/**
 * Interactive Dobsonian reflector. The Blender-rendered poster paints
 * instantly; on capable desktops the 411 KB GLB loads when the exhibit nears
 * the viewport. Phones, save-data and low-power devices keep the poster and
 * can opt in with a button. Every control works without the 3D view.
 */
export function TelescopeExhibit({ labels }: { labels: TelescopeExhibitLabels }) {
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const altId = useId();
  const reduce = useReducedMotion();
  const [capability, setCapability] = useState<Capability>('pending');
  const [wanted, setWanted] = useState(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [part, setPart] = useState<TelescopePart | null>(null);
  const [xray, setXray] = useState(false);
  const [altitude, setAltitude] = useState(35);
  const [version, setVersion] = useState(0);
  const yaw = useMotionValue(-0.5);
  const state = useRef<TelescopeSceneState>({ part: null, xray: false, altitude: 35 });
  const drag = useRef<{ x: number; id: number } | null>(null);

  useEffect(() => setCapability(detectCapability()), []);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    state.current = { part, xray, altitude };
    setVersion((v) => v + 1);
  }, [part, xray, altitude]);

  const onReady = useCallback(() => setReady(true), []);
  const show3d = !failed && near && (capability === 'webgl' || wanted);

  const rotateBy = (delta: number) => {
    const target = yaw.get() + delta;
    if (reduce) yaw.set(target);
    else animate(yaw, target, { type: 'spring', stiffness: 110, damping: 20 });
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!show3d || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drag.current = { x: event.clientX, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    yaw.set(yaw.get() + (event.clientX - d.x) * 0.012);
    d.x = event.clientX;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') rotateBy(-STEP);
    else if (event.key === 'ArrowRight') rotateBy(STEP);
    else return;
    event.preventDefault();
  };

  const active = part ? labels.parts[part] : null;

  return (
    <div ref={ref} className="mx-surface-powder grid overflow-hidden rounded-(--mx-radius-md) border border-(--mx-line) lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div
        className={cn('relative aspect-[4/5] min-h-[22rem] select-none sm:aspect-[5/4] lg:aspect-auto lg:min-h-[34rem]', show3d && 'cursor-grab touch-pan-y active:cursor-grabbing')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span aria-hidden="true" className="mx-scale absolute inset-x-8 bottom-6 opacity-60" />
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className={cn('object-contain p-6 transition-opacity duration-700', show3d && ready ? 'opacity-0' : 'opacity-100')}
        />
        {show3d ? (
          <div className={cn('absolute inset-0 transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}>
            <SceneBoundary onError={() => setFailed(true)}>
              <TelescopeScene state={state} yaw={yaw} version={version} onReady={onReady} />
            </SceneBoundary>
          </div>
        ) : null}
        <div className="absolute left-5 top-5 flex flex-col gap-1">
          <span className="mx-annot">Dobsonian · ⌀ 200 mm · f = 1200 mm · f/6</span>
        </div>
        {show3d && !ready ? <p className="mx-mono-label absolute inset-x-0 bottom-12 text-center">{labels.loading}</p> : null}
        {!show3d && capability !== 'pending' && !failed ? (
          <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-2 px-6 text-center">
            <button type="button" className="mx-btn mx-btn-primary mx-btn-sm" onClick={() => { setWanted(true); setNear(true); }}>
              <Box className="mx-btn-icon" aria-hidden="true" />
              {labels.load}
            </button>
          </div>
        ) : null}
      </div>

      <div role="group" aria-label={labels.label} onKeyDown={onKeyDown} className="flex flex-col gap-6 border-t border-(--mx-line) p-6 sm:p-8 lg:border-l lg:border-t-0">
        <div>
          <p className="mx-mono-label">{labels.hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PARTS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={part === key}
                aria-controls={panelId}
                onClick={() => setPart((current) => (current === key ? null : key))}
                className="mx-chip min-h-11"
              >
                {labels.parts[key].title}
              </button>
            ))}
          </div>
        </div>

        <div id={panelId} aria-live="polite" className="min-h-[6.5rem] border-l border-(--mx-mark) pl-4">
          {active ? (
            <>
              <p className="mx-h4">{active.title}</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-(--mx-fg-2)">{active.text}</p>
            </>
          ) : (
            <p className="text-[0.9375rem] leading-relaxed text-(--mx-fg-2)">{labels.parts.aperture.text}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <label htmlFor={altId} className="mx-mono-label flex justify-between">
              <span>{labels.altitude}</span>
              <span className="mx-readout text-(--mx-fg)">{altitude}°</span>
            </label>
            <input
              id={altId}
              type="range"
              min={10}
              max={85}
              step={1}
              value={altitude}
              onChange={(event) => setAltitude(Number(event.target.value))}
              aria-describedby={`${altId}-help`}
              className="mx-range mt-3 w-full"
            />
            <p id={`${altId}-help`} className="mt-1 text-[0.8125rem] text-(--mx-fg-3)">{labels.altitudeHelp}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <button type="button" className="mx-icon-btn" onClick={() => rotateBy(-STEP)} aria-label={labels.rotateLeft}>
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="mx-icon-btn" onClick={() => rotateBy(STEP)} aria-label={labels.rotateRight}>
              <RotateCw className="size-4" aria-hidden="true" />
            </button>
            <button type="button" aria-pressed={xray} className="mx-chip min-h-11 whitespace-normal text-left" onClick={() => setXray((value) => !value)}>
              {labels.xray}
            </button>
          </div>
        </div>
        <p className="mt-auto text-[0.8125rem] leading-relaxed text-(--mx-fg-3)">{failed ? labels.staticNote : labels.note}</p>
      </div>
    </div>
  );
}
