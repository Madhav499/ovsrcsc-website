'use client';

import Image, { type StaticImageData } from 'next/image';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Hotspot {
  /** Position in the photograph, as percentages of its width and height. */
  x: number;
  y: number;
  text: string;
}

interface HotspotPlateProps {
  photo: StaticImageData;
  alt: string;
  hotspots: Hotspot[];
  labels: { lookCloser: string; hint: string; archival: string };
  sizes: string;
  className?: string;
  /** Hide markers (e.g. when this plate is not the active chapter). */
  inert?: boolean;
}

/**
 * A photograph with numbered markers on things that are genuinely visible in
 * it. Markers are real buttons (44px targets, keyboard reachable); the note
 * for the selected marker is announced in a polite live region under the
 * image, so nothing depends on hover.
 */
export function HotspotPlate({ photo, alt, hotspots, labels, sizes, className, inert }: HotspotPlateProps) {
  const [active, setActive] = useState<number | null>(null);
  const noteId = useId();
  const current = active === null ? null : hotspots[active];

  return (
    <figure className={cn('min-w-0', className)}>
      <div className="mx-plate relative aspect-[3/2] w-full">
        <Image src={photo} alt={alt} fill sizes={sizes} placeholder="blur" className="object-cover" />
        <span aria-hidden="true" className="mx-ticks" />
        {!inert
          ? hotspots.map((spot, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={active === index}
                aria-controls={noteId}
                aria-label={`${labels.lookCloser} ${index + 1}: ${spot.text}`}
                onClick={() => setActive((value) => (value === index ? null : index))}
                className="mx-hotspot"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              >
                <span aria-hidden="true">{index + 1}</span>
              </button>
            ))
          : null}
      </div>
      <figcaption id={noteId} aria-live="polite" className="mt-3 grid min-h-[3.25rem] gap-1 border-l border-(--mx-mark) pl-4">
        <span className="mx-mono-label">
          {current ? `${labels.lookCloser} · ${(active ?? 0) + 1}/${hotspots.length}` : labels.archival}
        </span>
        <span className="text-[0.9375rem] leading-snug text-(--mx-fg-2)">{current ? current.text : labels.hint}</span>
      </figcaption>
    </figure>
  );
}
