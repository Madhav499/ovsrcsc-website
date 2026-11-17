'use client';

import Image from 'next/image';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { frameAspect, frameNumber, thumbUrl, type ArchivePhoto } from './film-model';
import type { FilmLabels } from './archive-data';
import { useScramble } from './use-scramble';

interface Props {
  photos: ArchivePhoto[];
  index: number | null;
  /** Screen rectangle of the frame it was opened from (strip or index). */
  origin: DOMRect | null;
  onIndex: (index: number | null) => void;
  /** Rectangle to return to on close (the frame may have moved meanwhile). */
  originFor: (index: number) => DOMRect | null;
  returnFocus: () => HTMLElement | null;
  labels: FilmLabels;
  locale: LocaleCode;
}

const EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The displayed (contained) rectangle of a photo inside its box. */
function containedRect(box: DOMRect, aspect: number): DOMRect {
  const w = Math.min(box.width, box.height * aspect);
  const h = w / aspect;
  return new DOMRect(box.left + (box.width - w) / 2, box.top + (box.height - h) / 2, w, h);
}

function flip(element: HTMLElement, from: DOMRect, to: DOMRect, reverse: boolean, duration = 620) {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  const start = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  const frames = reverse ? [{ transform: 'none' }, { transform: start }] : [{ transform: start }, { transform: 'none' }];
  return element.animate(frames, { duration, easing: EASE, fill: 'both' });
}

/**
 * The selected photograph brought forward: the frame lifts out of the roll
 * (or the light table) into a dark viewing room, its neighbours wait above
 * and below, and the record — only what the CMS actually holds — decodes in.
 */
export function PhotoProject({ photos, index, origin, onIndex, originFor, returnFocus, labels, locale }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const photoBox = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [direction, setDirection] = useState<0 | 1 | -1>(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const photo = index !== null ? photos[index] : null;

  // Open: show the dialog, then move the photo from its frame to centre stage.
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || index === null || phase !== 'closed') return;
    try {
      element.showModal();
    } catch {
      element.setAttribute('open', '');
    }
    document.documentElement.style.overflow = 'hidden';
    setPhase('opening');
    const box = photoBox.current;
    if (box && origin && !reduceMotion() && photo) {
      const target = containedRect(box.getBoundingClientRect(), frameAspect(photo));
      const inner = box.querySelector<HTMLElement>('.mx-proj-photo-inner');
      if (inner) {
        inner.style.width = `${target.width}px`;
        inner.style.height = `${target.height}px`;
        flip(inner, origin, target, false).finished.then(() => setPhase('open')).catch(() => setPhase('open'));
        return;
      }
    }
    setPhase('open');
  }, [index, origin, phase, photo]);

  const close = useCallback(() => {
    if (index === null || phase === 'closing') return;
    const element = dialog.current;
    const finish = () => {
      element?.close();
      document.documentElement.style.overflow = '';
      setPhase('closed');
      setDirection(0);
      onIndex(null);
      returnFocus()?.focus();
    };
    const back = originFor(index);
    const inner = photoBox.current?.querySelector<HTMLElement>('.mx-proj-photo-inner');
    setPhase('closing');
    if (inner && back && !reduceMotion()) {
      flip(inner, back, inner.getBoundingClientRect(), true, 520).finished.then(finish).catch(finish);
    } else {
      window.setTimeout(finish, reduceMotion() ? 0 : 260);
    }
  }, [index, phase, onIndex, originFor, returnFocus]);

  const go = useCallback(
    (delta: 1 | -1) => {
      if (index === null || count < 2) return;
      setDirection(delta);
      onIndex((index + delta + count) % count);
    },
    [index, count, onIndex],
  );

  // Size the contained photo for the current frame (and on resize).
  useLayoutEffect(() => {
    if (!photo || phase === 'closed') return;
    const size = () => {
      const box = photoBox.current;
      const inner = box?.querySelector<HTMLElement>('.mx-proj-photo-inner');
      if (!box || !inner) return;
      const target = containedRect(box.getBoundingClientRect(), frameAspect(photo));
      inner.style.width = `${target.width}px`;
      inner.style.height = `${target.height}px`;
    };
    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, [photo, phase]);

  const frameText = photo && index !== null ? `${frameNumber(index)} / ${String(count).padStart(2, '0')}` : '';
  const albumText = useScramble(photo ? photo.albumTitle.toUpperCase() : '', 600);
  const prev = index !== null && count > 1 ? photos[(index - 1 + count) % count] : null;
  const next = index !== null && count > 1 ? photos[(index + 1) % count] : null;
  const ready = phase === 'open';

  return (
    <dialog
      ref={dialog}
      aria-label={labels.viewer}
      className="mx-proj"
      data-phase={phase}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          go(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          go(-1);
        }
      }}
      onTouchStart={(event) => {
        const t = event.touches[0];
        touch.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        const t = event.changedTouches[0];
        touch.current = null;
        if (!start || !t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        if (Math.abs(d) > 50) go(d < 0 ? 1 : -1);
      }}
    >
      {photo && index !== null ? (
        <div ref={stage} className="mx-proj-room">
          <div className="mx-proj-bar">
            <button type="button" onClick={close} className="mx-proj-back">
              {labels.back}
            </button>
            <button type="button" onClick={close} className="mx-proj-round" aria-label={labels.close}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <dl className={cn('mx-proj-meta mx-proj-meta-left', ready && 'is-ready')}>
            <div>
              <dt>{labels.frame}</dt>
              <dd aria-live="polite">{frameText}</dd>
            </div>
            <div>
              <dt>{labels.album}</dt>
              <dd>
                <span aria-hidden="true">{albumText}</span>
                <span className="sr-only">{photo.albumTitle}</span>
              </dd>
            </div>
            {photo.date ? (
              <div>
                <dt>{labels.date}</dt>
                <dd>{formatDate(new Date(photo.date), locale)}</dd>
              </div>
            ) : null}
            {photo.caption ? (
              <div className="mx-proj-caption-row">
                <dt className="sr-only">{labels.caption}</dt>
                <dd className="mx-proj-caption">{photo.caption}</dd>
              </div>
            ) : null}
          </dl>

          <dl className={cn('mx-proj-meta mx-proj-meta-right', ready && 'is-ready')}>
            <div>
              <dt>{labels.collection}</dt>
              <dd>{labels.collectionName}</dd>
            </div>
            {photo.width && photo.height ? (
              <div>
                <dt>{labels.size}</dt>
                <dd>
                  {photo.width} × {photo.height} px
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="sr-only">{labels.original}</dt>
              <dd>
                <a href={mediaUrl(photo.storageKey)} target="_blank" rel="noopener noreferrer" className="mx-proj-link">
                  {labels.original}
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                  <span className="sr-only">({labels.newTab})</span>
                </a>
              </dd>
            </div>
          </dl>

          <div className="mx-proj-column">
            {prev ? (
              <div aria-hidden="true" className="mx-proj-peek mx-proj-peek-prev" style={{ ['--aspect' as string]: frameAspect(prev) }}>
                <Image src={mediaUrl(prev.storageKey)} alt="" fill sizes="48vw" className="object-cover" />
              </div>
            ) : null}
            <div ref={photoBox} className="mx-proj-photo">
              <div
                key={photo.id}
                className="mx-proj-photo-inner"
                data-direction={direction}
                style={{ backgroundImage: `url("${thumbUrl(photo.storageKey)}")` }}
              >
                <Image src={mediaUrl(photo.storageKey)} alt={photo.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" priority className="object-contain" />
              </div>
            </div>
            {next ? (
              <div aria-hidden="true" className="mx-proj-peek mx-proj-peek-next" style={{ ['--aspect' as string]: frameAspect(next) }}>
                <Image src={mediaUrl(next.storageKey)} alt="" fill sizes="48vw" className="object-cover" />
              </div>
            ) : null}
          </div>

          {count > 1 ? (
            <div className={cn('mx-proj-nav', ready && 'is-ready')}>
              <button type="button" onClick={() => go(-1)} className="mx-proj-ring">
                {labels.prev} · {frameNumber((index - 1 + count) % count)}
              </button>
              <button type="button" onClick={() => go(1)} className="mx-proj-ring">
                {labels.next} · {frameNumber((index + 1) % count)}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
