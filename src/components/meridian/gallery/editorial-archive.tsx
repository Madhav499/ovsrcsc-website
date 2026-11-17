'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/meridian/motion/reveal';
import { LightboxDialog, PhotoButton, useLightbox, type LightboxItem, type LightboxLabels } from './lightbox-gallery';

/*
 * Editorial sequence: photographs are laid out in repeating "spreads" with
 * different spans, offsets and entrances, always at their true aspect ratio
 * (nothing is cropped). The sequence adapts to however many photos exist —
 * no duplication, no empty slots.
 *
 *   feature — one photograph across the page, caption in the margin
 *   pair    — a wide plate and a narrow one, set lower
 *   trio    — three plates on a stepped baseline
 *   margin  — an offset plate with a scientific figure in the margin
 */
type Spread = 'feature' | 'pair' | 'trio' | 'margin';
const ORDER: Array<{ kind: Spread; size: number }> = [
  { kind: 'feature', size: 1 },
  { kind: 'pair', size: 2 },
  { kind: 'trio', size: 3 },
  { kind: 'margin', size: 1 },
  { kind: 'pair', size: 2 },
  { kind: 'trio', size: 3 },
];

function plan(count: number) {
  const spreads: Array<{ kind: Spread; start: number; size: number }> = [];
  let at = 0;
  let k = 0;
  while (at < count) {
    const step = ORDER[k % ORDER.length];
    const size = Math.min(step.size, count - at);
    const kind: Spread = size === 1 ? (step.kind === 'margin' ? 'margin' : 'feature') : size === 2 ? 'pair' : step.kind;
    spreads.push({ kind, start: at, size });
    at += size;
    k += 1;
  }
  return spreads;
}

interface EditorialArchiveProps {
  items: LightboxItem[];
  labels: LightboxLabels;
  /** Caption metadata appended to every plate (e.g. the album date). */
  dateline?: string;
  /** Rendered in the margin of "margin" spreads (one shared figure). */
  marginFigure?: ReactNode;
  plateLabel: string;
}

export function EditorialArchive({ items, labels, dateline, marginFigure, plateLabel }: EditorialArchiveProps) {
  const box = useLightbox(items.length);
  if (!items.length) return null;
  let marginShown = false;

  const caption = (item: LightboxItem, index: number, className?: string) => (
    <figcaption className={cn('mx-figcap', className)}>
      <span className="mx-figcap-num">
        {plateLabel} {String(index + 1).padStart(2, '0')}
      </span>
      <span>
        {item.caption || item.altText}
        {dateline ? <span className="mx-mono-label ml-2 normal-case">· {dateline}</span> : null}
      </span>
    </figcaption>
  );

  const plate = (index: number, sizes: string, className?: string, priority?: boolean) => (
    <PhotoButton item={items[index]} index={index} onOpen={box.open} label={labels.open} sizes={sizes} priority={priority} className={className} />
  );

  return (
    <>
      <div className="grid gap-20 sm:gap-28">
        {plan(items.length).map(({ kind, start, size }, spreadIndex) => {
          const key = `${kind}-${start}`;
          if (kind === 'feature') {
            return (
              <Reveal key={key} variant="mask" as="figure" className="grid gap-6 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-9">{plate(start, '(min-width: 1024px) 72vw, 100vw', undefined, spreadIndex === 0)}</div>
                {caption(items[start], start, 'lg:col-span-3 lg:mt-0 lg:flex-col lg:pb-2')}
              </Reveal>
            );
          }
          if (kind === 'pair') {
            return (
              <div key={key} className="grid gap-12 sm:grid-cols-12 sm:gap-8">
                <Reveal as="figure" className="sm:col-span-7">
                  {plate(start, '(min-width: 640px) 56vw, 100vw')}
                  {caption(items[start], start)}
                </Reveal>
                <Reveal as="figure" delay={0.12} className="sm:col-span-4 sm:col-start-9 sm:mt-32">
                  {plate(start + 1, '(min-width: 640px) 32vw, 100vw')}
                  {caption(items[start + 1], start + 1)}
                </Reveal>
              </div>
            );
          }
          if (kind === 'trio') {
            const offsets = ['', 'sm:mt-20', 'sm:mt-8'];
            return (
              <div key={key} className="grid gap-12 sm:grid-cols-3 sm:gap-6 lg:gap-10">
                {Array.from({ length: size }, (_, k) => (
                  <Reveal key={start + k} as="figure" variant="fade" delay={k * 0.1} className={offsets[k]}>
                    {plate(start + k, '(min-width: 640px) 31vw, 100vw')}
                    {caption(items[start + k], start + k)}
                  </Reveal>
                ))}
              </div>
            );
          }
          const withFigure = Boolean(marginFigure) && !marginShown;
          marginShown = marginShown || withFigure;
          return (
            <div key={key} className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <Reveal as="figure" variant="mask" className="lg:col-span-7 lg:col-start-2">
                {plate(start, '(min-width: 1024px) 56vw, 100vw')}
                {caption(items[start], start)}
              </Reveal>
              {withFigure ? <div className="lg:col-span-3 lg:col-start-10">{marginFigure}</div> : null}
            </div>
          );
        })}
      </div>
      <LightboxDialog items={items} index={box.index} setIndex={box.setIndex} go={box.go} openerRef={box.openerRef} labels={labels} />
    </>
  );
}
