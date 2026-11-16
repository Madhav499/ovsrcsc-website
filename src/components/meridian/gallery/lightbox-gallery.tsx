'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

export interface LightboxItem {
  id: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string | null;
}

interface LightboxGalleryProps {
  items: LightboxItem[];
  labels: {
    open: string;
    close: string;
    previous: string;
    next: string;
    counter: string;
    of: string;
    viewer: string;
  };
}

function ratio(item: LightboxItem): string {
  if (item.width && item.height) return `${item.width} / ${item.height}`;
  return '4 / 3';
}

/**
 * Exhibition wall (masonry that preserves each photograph's true ratio)
 * plus a full-screen viewer: ←/→ keys, swipe, Escape, focus returned to the
 * opening thumbnail.
 */
export function LightboxGallery({ items, labels }: LightboxGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const touchX = useRef<number | null>(null);
  const count = items.length;

  const go = useCallback(
    (delta: number) => setIndex((current) => (current === null ? current : (current + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
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

  const onClose = () => {
    setIndex(null);
    document.documentElement.style.overflow = '';
    openerRef.current?.focus();
  };

  if (!count) return null;
  const active = index !== null ? items[index] : null;

  return (
    <>
      <ul className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
        {items.map((item, itemIndex) => (
          <li key={item.id} className="mb-3 break-inside-avoid sm:mb-4">
            <figure>
              <button
                type="button"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setIndex(itemIndex);
                }}
                className="group mx-plate mx-zoom relative block w-full cursor-zoom-in"
                style={{ aspectRatio: ratio(item) }}
                aria-label={`${labels.open}: ${item.altText}`}
              >
                <Image
                  src={mediaUrl(item.storageKey)}
                  alt={item.altText}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-(--mx-ivory)/90 text-(--mx-midnight) opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Expand className="size-4" />
                </span>
                <span
                  aria-hidden="true"
                  className="mx-mono-label absolute bottom-3 left-3 rounded-(--mx-radius-xs) bg-(--mx-midnight)/75 px-2 py-1 !text-(--mx-ivory) opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                >
                  {String(itemIndex + 1).padStart(2, '0')}
                </span>
              </button>
              {item.caption ? (
                <figcaption className="mt-2 text-[0.8125rem] leading-snug text-(--mx-fg-3)">{item.caption}</figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={onClose}
        aria-label={labels.viewer}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') go(1);
          if (event.key === 'ArrowLeft') go(-1);
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
        className="mx-dialog mx-surface-dark m-0 h-dvh max-h-none w-full max-w-none p-0"
      >
        {active && index !== null ? (
          <div className="flex h-full flex-col">
            <div className="mx-container flex h-16 shrink-0 items-center justify-between gap-4 sm:h-20">
              <p className="mx-mono-label" aria-live="polite">
                {labels.counter} {index + 1} {labels.of} {count}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                className="mx-icon-btn"
                aria-label={labels.close}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 px-3 sm:px-20">
              <div key={active.id} className="relative size-full animate-[mx-fade-in_500ms_ease-out]">
                <Image
                  src={mediaUrl(active.storageKey)}
                  alt={active.altText}
                  fill
                  sizes="100vw"
                  priority
                  className="object-contain"
                />
              </div>
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="mx-icon-btn absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 bg-(--mx-midnight)/60 sm:left-6 sm:grid"
                    aria-label={labels.previous}
                  >
                    <ChevronLeft className="size-6" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="mx-icon-btn absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 bg-(--mx-midnight)/60 sm:right-6 sm:grid"
                    aria-label={labels.next}
                  >
                    <ChevronRight className="size-6" aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="mx-container flex shrink-0 items-center justify-between gap-4 py-5">
              {count > 1 ? (
                <button type="button" onClick={() => go(-1)} className="mx-icon-btn sm:hidden" aria-label={labels.previous}>
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
              ) : null}
              <p className="mx-auto max-w-2xl text-center text-[0.9375rem] text-(--mx-fg-2)">
                {active.caption || active.altText}
              </p>
              {count > 1 ? (
                <button type="button" onClick={() => go(1)} className="mx-icon-btn sm:hidden" aria-label={labels.next}>
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {count > 1 ? (
              <div className="mx-hide-scrollbar hidden shrink-0 overflow-x-auto pb-5 md:block">
                <ul className="mx-auto flex w-max gap-2 px-6">
                  {items.map((item, itemIndex) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setIndex(itemIndex)}
                        aria-label={`${labels.counter} ${itemIndex + 1}`}
                        aria-current={itemIndex === index ? 'true' : undefined}
                        className={cn(
                          'relative block h-12 w-16 overflow-hidden rounded-(--mx-radius-xs) transition-opacity duration-300',
                          itemIndex === index ? 'opacity-100 ring-2 ring-(--mx-amber)' : 'opacity-45 hover:opacity-80',
                        )}
                      >
                        <Image src={mediaUrl(item.storageKey)} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
