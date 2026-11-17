'use client';

import Image from 'next/image';
import { forwardRef, useState } from 'react';
import { mediaUrl } from '@/lib/media';
import { heightRatio, type ArchivePhoto } from './archive-model';

interface PhotoTileProps {
  photo: ArchivePhoto;
  sizes: string;
  priority?: boolean;
  openLabel: string;
  unavailableLabel: string;
  onOpen: (opener: HTMLButtonElement) => void;
}

/**
 * One photograph. Space is reserved from the stored dimensions (no layout
 * shift); a powder placeholder holds the place, the photo fades in once
 * decoded, and a failed image degrades to a quiet labelled panel. The
 * caption appears only on hover/focus — the photograph stays the subject.
 */
export const PhotoTile = forwardRef<HTMLButtonElement, PhotoTileProps>(function PhotoTile(
  { photo, sizes, priority, openLabel, unavailableLabel, onOpen },
  ref,
) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={`${openLabel}: ${photo.alt}`}
      className="mx-archive-tile group"
      style={{ paddingBottom: `${heightRatio(photo) * 100}%` }}
      data-state={state}
    >
      {state !== 'failed' ? (
        <Image
          src={mediaUrl(photo.storageKey)}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className="mx-archive-img"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-4 text-center">
          <span className="mx-mono-label">{unavailableLabel}</span>
        </span>
      )}
      {photo.caption ? (
        <span aria-hidden="true" className="mx-archive-caption">
          {photo.caption}
        </span>
      ) : null}
    </button>
  );
});

export function tileSizes(view: 'grid' | 'feature', wide?: boolean) {
  if (view === 'feature') return wide ? '(min-width: 768px) 58vw, 100vw' : '(min-width: 768px) 40vw, 100vw';
  // Column width minus gutters, so 2× phones pick the 384px derivative, not 640px.
  return '(min-width: 1024px) calc(25vw - 24px), (min-width: 640px) calc(33vw - 24px), calc(50vw - 24px)';
}

