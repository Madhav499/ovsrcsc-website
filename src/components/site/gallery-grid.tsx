'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

export interface GalleryGridItem {
  id: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string | null;
}

interface GalleryGridProps {
  items: GalleryGridItem[];
  labels: {
    open: string;
    close: string;
    previous: string;
    next: string;
    exhibition?: string;
    closeExhibition?: string;
    plate?: string;
  };
}

function plateNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function GalleryGrid({ items, labels }: GalleryGridProps) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null) {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute('open', '');
        }
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [index]);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (current === null) return current;
        return (current + delta + items.length) % items.length;
      });
    },
    [items.length],
  );

  if (items.length === 0) return null;
  const active = index !== null ? items[index] : null;

  return (
    <>
      {labels.exhibition ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-ink-muted/70">
            {labels.plate ? `${labels.plate}s · 01–${plateNumber(items.length - 1)}` : ''}
          </p>
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="btn btn-outline !border-brass/50 !py-2 !text-xs hover:!bg-brass/10"
          >
            <Expand className="size-3.5" aria-hidden="true" />
            {labels.exhibition}
          </button>
        </div>
      ) : null}

      {/* Exhibition wall — editorial masonry with plate markers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {items.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-xl bg-warm-ivory',
              itemIndex === 0 && 'col-span-2 row-span-2 aspect-auto min-h-64 sm:col-span-2',
            )}
            aria-label={`${labels.open}: ${item.altText}`}
          >
            <Image
              src={mediaUrl(item.storageKey)}
              alt={item.altText}
              fill
              sizes={
                itemIndex === 0
                  ? '(max-width: 640px) 100vw, 50vw'
                  : '(max-width: 640px) 50vw, 25vw'
              }
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
            <span className="absolute inset-0 bg-carbon/0 transition-colors duration-500 group-hover:bg-carbon/30" aria-hidden="true" />
            <span
              className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-warm-ivory opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            >
              {labels.plate ? `${labels.plate} ${plateNumber(itemIndex)}` : plateNumber(itemIndex)}
            </span>
            <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-warm-ivory/90 text-carbon opacity-0 transition-all duration-300 group-hover:opacity-100">
              <Expand className="size-3.5" aria-hidden="true" />
            </span>
            {item.caption ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-carbon/70 via-carbon/30 to-transparent p-3.5 text-left text-xs font-medium text-warm-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {item.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ——— EXHIBITION MODE ——— */}
      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') go(-1);
          if (event.key === 'ArrowRight') go(1);
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          if (Math.abs(delta) > 48) go(delta < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
        className="m-auto w-screen max-w-none bg-transparent p-0 text-warm-ivory backdrop:bg-carbon/95 backdrop:backdrop-blur-md"
        aria-label={labels.exhibition ?? labels.open}
      >
        {active ? (
          <div className="relative flex min-h-screen flex-col justify-center p-4 sm:p-8">
            <div className="absolute left-1/2 top-5 -translate-x-1/2 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-brass">
                {labels.plate ?? ''}
              </p>
              <p className="mt-1 rounded-full bg-warm-ivory/8 px-4 py-1 text-xs font-medium tracking-wider text-warm-ivory/70">
                {index !== null ? plateNumber(index) : '—'} / {plateNumber(items.length - 1)}
              </p>
            </div>

            <div
              className="relative mx-auto h-[74vh] w-full max-w-6xl"
              style={{ animation: 'exhibitionFocus 700ms cubic-bezier(0.19,1,0.22,1)' }}
              key={active.id}
            >
              <Image
                src={mediaUrl(active.storageKey)}
                alt={active.altText}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            <div className="mx-auto mt-5 flex w-full max-w-6xl items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-warm-ivory/20 bg-warm-ivory/5 transition-all duration-300 hover:border-brass/60 hover:bg-brass/15"
                aria-label={labels.previous}
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <p className="min-w-0 max-w-xl text-center text-sm leading-relaxed text-warm-ivory/75">
                {active.caption || active.altText}
              </p>
              <button
                type="button"
                onClick={() => go(1)}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-warm-ivory/20 bg-warm-ivory/5 transition-all duration-300 hover:border-brass/60 hover:bg-brass/15"
                aria-label={labels.next}
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-warm-ivory text-carbon transition-all duration-300 hover:bg-brass hover:text-warm-ivory sm:right-6 sm:top-6"
              aria-label={labels.close}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
