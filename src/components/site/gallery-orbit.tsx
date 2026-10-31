'use client';

import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { Telescope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppImage } from '@/components/ui/app-image';

export interface OrbitAlbum {
  id: string;
  slug: string;
  title: string;
  photoCount: number;
  coverKey: string | null;
  dateLabel: string;
}

interface GalleryOrbitProps {
  albums: OrbitAlbum[];
  locale: string;
  labels: {
    centre: string;
    centreNote: string;
    openAlbum: string;
    photos: string;
  };
}

const RING_RADII = [46, 34, 20];

export function GalleryOrbit({ albums, locale, labels }: GalleryOrbitProps) {
  const reduceMotion = useReducedMotion();

  const rings: OrbitAlbum[][] = [];
  const perRing = albums.length <= 5 ? Math.max(albums.length, 1) : Math.ceil(albums.length / Math.min(3, Math.ceil(albums.length / 3)));
  for (let index = 0; index < albums.length; index += perRing) {
    rings.push(albums.slice(index, index + perRing));
  }

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center" role="navigation" aria-label={labels.centre}>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full',
          'bg-[radial-gradient(circle_at_center,rgba(165,139,98,0.12),transparent_65%)]',
        )}
      />

      {rings.map((ring, ringIndex) => {
        const radius = RING_RADII[Math.min(ringIndex, RING_RADII.length - 1)];
        const speed = 90 + ringIndex * 34;
        const reverse = ringIndex % 2 === 1;
        return (
          <div
            key={ringIndex}
            className={cn(
              'absolute rounded-full border border-stone/20',
              !reduceMotion && 'animate-[slowRotate_var(--orbitSpeed)_linear_infinite]',
            )}
            style={{
              width: `${radius * 2}%`,
              height: `${radius * 2}%`,
              ['--orbitSpeed' as string]: `${speed}s`,
              animationDirection: reverse ? 'reverse' : 'normal',
            }}
            aria-hidden="true"
          >
            {ring.map((album, nodeIndex) => {
              const count = ring.length;
              const angle = ((nodeIndex + (ringIndex % 2 ? 0.5 : 0)) / count) * Math.PI * 2;
              const x = 50 + Math.cos(angle) * 50;
              const y = 50 + Math.sin(angle) * 50;
              return (
                <div
                  key={album.id}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={cn(
                      'group relative',
                      !reduceMotion && 'animate-[slowRotate_var(--orbitSpeed)_linear_infinite_reverse]',
                    )}
                    style={{
                      ['--orbitSpeed' as string]: `${speed}s`,
                      animationDirection: reverse ? 'normal' : 'reverse',
                    }}
                  >
                    <Link
                      href={`/${locale}/gallery/${album.slug}`}
                      className="peer block size-11 overflow-hidden rounded-full border border-stone/40 bg-graphite outline-none ring-brass/40 transition-all duration-300 hover:scale-110 hover:border-brass focus-visible:ring-2 sm:size-14"
                      aria-label={`${album.title} — ${album.photoCount} ${labels.photos}`}
                    >
                      {album.coverKey ? (
                        <AppImage
                          storageKey={album.coverKey}
                          alt={album.title}
                          fill
                          sizes="56px"
                          className="opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-stone/50">
                          <Telescope className="size-4" aria-hidden="true" />
                        </span>
                      )}
                    </Link>
                    <span
                      className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-44 -translate-x-1/2 rounded-full border border-line bg-ink px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-warm-ivory opacity-0 transition-opacity duration-300 peer-hover:opacity-100"
                      aria-hidden="true"
                    >
                      {album.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="relative z-10 grid size-32 place-items-center rounded-full border border-brass/25 bg-carbon/85 text-center shadow-[0_0_60px_rgba(165,139,98,0.12)] sm:size-40">
        <div>
          <span className="mx-auto block h-px w-8 bg-brass/40" aria-hidden="true" />
          <p className="mt-2 px-3 font-display text-sm font-medium leading-snug text-warm-ivory sm:text-base">
            {labels.centre}
          </p>
          <p className="mt-1 px-3 text-[10px] uppercase tracking-[0.2em] text-brass">{labels.centreNote}</p>
        </div>
      </div>
    </div>
  );
}
