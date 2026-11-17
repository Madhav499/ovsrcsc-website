'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { padCount, type ArchivePhoto } from './archive-model';

export interface ViewerLabels {
  viewer: string;
  close: string;
  previous: string;
  next: string;
  original: string;
  newTab: string;
}

interface PhotoViewerProps {
  photos: ArchivePhoto[];
  index: number | null;
  onIndex: (index: number | null) => void;
  /** Element to return focus to when the viewer closes. */
  returnFocus: () => HTMLElement | null;
  labels: ViewerLabels;
}

/**
 * Full-screen viewer on a native <dialog> (modal focus trap, Escape, focus
 * returned to the opening photograph). The photograph is contained on an
 * ivory field with almost no chrome: click the left or right half (or use
 * ← → / swipe) to move. Neighbouring photographs are preloaded.
 */
export function PhotoViewer({ photos, index, onIndex, returnFocus, labels }: PhotoViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const count = photos.length;
  const go = (delta: number) => {
    if (index === null || count < 2) return;
    onIndex((index + delta + count) % count);
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
      document.documentElement.style.overflow = 'hidden';
    }
    if (index === null && dialog.open) dialog.close();
  }, [index]);

  useEffect(() => () => void (document.documentElement.style.overflow = ''), []);

  const active = index !== null ? photos[index] : null;
  const neighbours = index !== null && count > 1 ? [photos[(index + 1) % count], photos[(index - 1 + count) % count]] : [];

  return (
    <dialog
      ref={ref}
      aria-label={labels.viewer}
      onClose={() => {
        document.documentElement.style.overflow = '';
        onIndex(null);
        returnFocus()?.focus();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(1);
        else if (event.key === 'ArrowLeft') go(-1);
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(delta) > 48) go(delta < 0 ? 1 : -1);
        touchX.current = null;
      }}
      className="mx-viewer"
    >
      {active && index !== null ? (
        <div className="relative flex h-full flex-col">
          <div className="relative z-10 flex items-start justify-between gap-6 px-[var(--mx-gutter)] pt-4 sm:pt-6">
            <p className="mx-mono-label pt-3" aria-live="polite">
              {padCount(index + 1)} / {padCount(count)}
            </p>
            <button type="button" autoFocus onClick={() => ref.current?.close()} className="mx-viewer-close">
              {labels.close}
            </button>
          </div>

          <div className="relative min-h-0 flex-1 px-[var(--mx-gutter)] py-4 sm:px-[8vw] sm:py-6">
            <div key={active.id} className="mx-viewer-photo relative size-full">
              <Image src={mediaUrl(active.storageKey)} alt={active.alt} fill sizes="100vw" priority className="object-contain" />
            </div>
            {count > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={labels.previous} className="mx-viewer-half left-0 cursor-w-resize" />
                <button type="button" onClick={() => go(1)} aria-label={labels.next} className="mx-viewer-half right-0 cursor-e-resize" />
              </>
            ) : null}
          </div>

          <div className="relative z-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-[var(--mx-gutter)] pb-5 sm:pb-7">
            <p className="max-w-2xl text-[0.9375rem] text-(--mx-fg-2)">{active.caption || active.alt}</p>
            <a href={mediaUrl(active.storageKey)} target="_blank" rel="noopener noreferrer" className="mx-link text-[0.875rem]">
              {labels.original}
              <ArrowUpRight className="mx-btn-icon" aria-hidden="true" />
              <span className="sr-only">({labels.newTab})</span>
            </a>
          </div>

          {/* Preload the neighbours at the same responsive size */}
          {neighbours.map((photo) => (
            <Image key={`pre-${photo.id}`} src={mediaUrl(photo.storageKey)} alt="" aria-hidden="true" width={photo.width ?? 1600} height={photo.height ?? 1200} sizes="100vw" loading="eager" className="pointer-events-none absolute size-px opacity-0" />
          ))}
        </div>
      ) : null}
    </dialog>
  );
}
