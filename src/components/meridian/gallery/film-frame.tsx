'use client';

import Image from 'next/image';
import { forwardRef, useState, type CSSProperties } from 'react';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { frameAspect, frameNumber, type ArchivePhoto } from './film-model';

interface FilmFrameProps {
  photo: ArchivePhoto;
  index: number;
  edge: string;
  sizes: string;
  label: string;
  unavailable: string;
  onOpen: (opener: HTMLButtonElement) => void;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * One exposure on a strip of film, drawn in CSS: ink film base, sprocket
 * holes along both edges, edge print above and the frame number below. The
 * image window takes the photograph's own proportions (nothing is cropped);
 * the frame is a real button that opens the viewer.
 */
export const FilmFrame = forwardRef<HTMLButtonElement, FilmFrameProps>(function FilmFrame(
  { photo, index, edge, sizes, label, unavailable, onOpen, priority, className, style },
  ref,
) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const aspect = frameAspect(photo);
  return (
    <button
      ref={ref}
      type="button"
      data-photo={photo.id}
      data-state={state}
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={label}
      className={cn('mx-film-frame group', className)}
      style={{ ...style, ['--aspect' as string]: aspect }}
    >
      <span aria-hidden="true" className="mx-film-edge mx-film-edge-top">
        <span>{edge}</span>
        <span>{frameNumber(index)}</span>
      </span>
      <span className="mx-film-window">
        {state !== 'failed' ? (
          <Image
            src={mediaUrl(photo.storageKey)}
            alt={photo.alt}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setState('loaded')}
            onError={() => setState('failed')}
            className="mx-film-img"
          />
        ) : (
          <span className="mx-film-missing">{unavailable}</span>
        )}
      </span>
      <span aria-hidden="true" className="mx-film-edge mx-film-edge-bottom">
        <span>{frameNumber(index)}</span>
        <span className="mx-film-arrow">▸</span>
        <span>{frameNumber(index, true)}</span>
      </span>
    </button>
  );
});
