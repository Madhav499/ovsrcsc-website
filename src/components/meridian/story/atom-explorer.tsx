'use client';

import { animate, useMotionValue, useReducedMotion, useScroll } from 'framer-motion';
import { RotateCcw, RotateCw } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import type { AtomControls, AtomFocus } from '@/components/meridian/visualizations/atom-scene';
import { AtomStage } from '@/components/meridian/visualizations/atom-stage';

type Part = Exclude<AtomFocus, null>;

export interface AtomExplorerLabels {
  label: string;
  hint: string;
  rotateLeft: string;
  rotateRight: string;
  parts: Record<Part, { title: string; text: string }>;
}

const PARTS: Part[] = ['nucleus', 'electrons', 'orbits'];
const PART_DOT: Record<Part, string> = {
  nucleus: 'bg-(--mx-ivory)',
  electrons: 'bg-(--mx-cyan)',
  orbits: 'bg-(--mx-amber)',
};
const STEP = Math.PI / 4;

/**
 * The hero atom as an exhibit: it transforms as the hero scrolls away, the
 * visitor can drag it (or use the rotate buttons / arrow keys — a
 * single-pointer and keyboard alternative), and each part can be
 * highlighted with a short explanation.
 */
export function AtomExplorer({ labels, className }: { labels: AtomExplorerLabels; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const reduce = useReducedMotion();
  const [focus, setFocus] = useState<AtomFocus>(null);
  const yaw = useMotionValue(0);
  const pitch = useMotionValue(0);
  const controls = useMemo<AtomControls>(() => ({ yaw, pitch }), [yaw, pitch]);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const rotateBy = (delta: number) => {
    const target = yaw.get() + delta;
    if (reduce) yaw.set(target);
    else animate(yaw, target, { type: 'spring', stiffness: 120, damping: 20 });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    yaw.set(yaw.get() + (event.clientX - state.x) * 0.01);
    pitch.set(Math.max(-0.9, Math.min(0.9, pitch.get() + (event.clientY - state.y) * 0.006)));
    state.x = event.clientX;
    state.y = event.clientY;
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') rotateBy(-STEP);
    else if (event.key === 'ArrowRight') rotateBy(STEP);
    else return;
    event.preventDefault();
  };

  const active = focus ? labels.parts[focus] : null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div
        className="size-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <AtomStage className="size-full" progress={scrollYProgress} focus={focus} controls={controls} />
      </div>

      {/* Exhibit controls — desktop only, where the atom is the hero's visual. */}
      <div
        role="group"
        aria-label={labels.label}
        onKeyDown={onKeyDown}
        className="mx-surface-dark absolute inset-x-0 bottom-0 hidden flex-col items-center gap-3 bg-transparent lg:flex"
      >
        <p className="mx-mono-label rounded-full bg-(--mx-midnight)/70 px-3 py-1 backdrop-blur-md">{labels.hint}</p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-(--mx-line) bg-(--mx-midnight)/75 p-1.5 backdrop-blur-md">
          <button type="button" className="mx-chip min-h-11 min-w-11 justify-center border-transparent" onClick={() => rotateBy(-STEP)} aria-label={labels.rotateLeft}>
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
          {PARTS.map((part) => (
            <button
              key={part}
              type="button"
              aria-pressed={focus === part}
              aria-controls={panelId}
              onClick={() => setFocus((current) => (current === part ? null : part))}
              className="mx-chip min-h-11 min-w-11 justify-center border-transparent"
            >
              <span className={cn('size-2 rounded-full', PART_DOT[part])} aria-hidden="true" />
              {labels.parts[part].title}
            </button>
          ))}
          <button type="button" className="mx-chip min-h-11 min-w-11 justify-center border-transparent" onClick={() => rotateBy(STEP)} aria-label={labels.rotateRight}>
            <RotateCw className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p
          id={panelId}
          aria-live="polite"
          className={cn(
            'min-h-[3.25rem] max-w-[26rem] text-center text-[0.875rem] leading-relaxed text-(--mx-fg-2) transition-opacity duration-300',
            active ? 'opacity-100' : 'opacity-0',
          )}
        >
          {active ? active.text : ''}
        </p>
      </div>
    </div>
  );
}
