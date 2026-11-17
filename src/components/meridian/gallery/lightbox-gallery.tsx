'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { ChevronLeft, ChevronRight, Expand, Maximize2, X } from 'lucide-react';
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

export interface LightboxLabels {
  open: string;
  close: string;
  previous: string;
  next: string;
  counter: string;
  of: string;
  viewer: string;
  fullSize?: string;
  newTab?: string;
}

export function ratio(item: LightboxItem): string {
  if (item.width && item.height) return `${item.width} / ${item.height}`;
  return '4 / 3';
}

/** Shared open/close state for any layout that opens the viewer. */
export function useLightbox(count: number) {
  const [index, setIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const open = useCallback((at: number, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    setIndex(at);
  }, []);
  const go = useCallback(
    (delta: number) => setIndex((current) => (current === null ? current : (current + delta + count) % count)),
    [count],
  );
  return { index, setIndex, open, go, openerRef };
}

/**
 * Full-screen viewer on a native <dialog> (focus trap, Escape, focus
 * returned to the opening photograph): ←/→ keys, swipe, a filmstrip, the
 * caption, and a link to the full-resolution original.
 */
export function LightboxDialog({
  items,
  index,
  setIndex,
  go,
  openerRef,
  labels,
}: {
  items: LightboxItem[];
  index: number | null;
  setIndex: (value: number | null) => void;
  go: (delta: number) => void;
  openerRef: RefObject<HTMLButtonElement | null>;
  labels: LightboxLabels;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const count = items.length;

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

  const active = index !== null ? items[index] : null;

  return (
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
              {labels.counter} {String(index + 1).padStart(2, '0')} {labels.of} {String(count).padStart(2, '0')}
            </p>
            <div className="flex items-center gap-2">
              {labels.fullSize ? (
                <a href={mediaUrl(active.storageKey)} target="_blank" rel="noopener noreferrer" className="mx-icon-btn" aria-label={`${labels.fullSize} (${labels.newTab ?? ''})`}>
                  <Maximize2 className="size-4" aria-hidden="true" />
                </a>
              ) : null}
              <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="mx-icon-btn" aria-label={labels.close}>
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 px-3 sm:px-20">
            <div key={active.id} className="relative size-full animate-[mx-lightbox-in_600ms_cubic-bezier(0.19,1,0.22,1)] motion-reduce:animate-none">
              <Image src={mediaUrl(active.storageKey)} alt={active.altText} fill sizes="100vw" priority className="object-contain" />
            </div>
            {count > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} className="mx-icon-btn absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 bg-(--mx-charcoal)/60 sm:left-6 sm:grid" aria-label={labels.previous}>
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => go(1)} className="mx-icon-btn absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 bg-(--mx-charcoal)/60 sm:right-6 sm:grid" aria-label={labels.next}>
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
            <p className="mx-auto flex max-w-2xl items-baseline gap-3 text-center text-[0.9375rem] text-(--mx-fg-2)">
              <span className="mx-figcap-num hidden sm:inline">Pl. {String(index + 1).padStart(2, '0')}</span>
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
                        itemIndex === index ? 'opacity-100 ring-2 ring-(--mx-brass-light)' : 'opacity-45 hover:opacity-80',
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
  );
}

/** Opening button for one photograph — keeps the photo's true ratio. */
export function PhotoButton({
  item,
  index,
  onOpen,
  label,
  sizes,
  priority,
  className,
}: {
  item: LightboxItem;
  index: number;
  onOpen: (index: number, opener: HTMLButtonElement) => void;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(index, event.currentTarget)}
      className={cn('group mx-plate mx-zoom relative block w-full cursor-zoom-in', className)}
      style={{ aspectRatio: ratio(item) }}
      aria-label={`${label}: ${item.altText}`}
    >
      <Image src={mediaUrl(item.storageKey)} alt={item.altText} fill sizes={sizes} priority={priority} className="object-cover" />
      <span aria-hidden="true" className="mx-ticks opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-(--mx-ivory)/90 text-(--mx-charcoal) opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Expand className="size-4" />
      </span>
    </button>
  );
}

/** Compact exhibition wall (masonry) — used where many photos need a quick overview. */
export function LightboxGallery({ items, labels }: { items: LightboxItem[]; labels: LightboxLabels }) {
  const box = useLightbox(items.length);
  if (!items.length) return null;
  return (
    <>
      <ul className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
        {items.map((item, itemIndex) => (
          <li key={item.id} className="mb-3 break-inside-avoid sm:mb-4">
            <figure>
              <PhotoButton item={item} index={itemIndex} onOpen={box.open} label={labels.open} sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" />
              {item.caption ? <figcaption className="mt-2 text-[0.8125rem] leading-snug text-(--mx-fg-3)">{item.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      <LightboxDialog items={items} index={box.index} setIndex={box.setIndex} go={box.go} openerRef={box.openerRef} labels={labels} />
    </>
  );
}
