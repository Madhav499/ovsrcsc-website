'use client';

import type { StaticImageData } from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { HotspotPlate, type Hotspot } from './hotspot-plate';

export interface LabExplorerChapter {
  key: string;
  name: string;
  question: string;
  text: string;
  photo: StaticImageData;
  hotspots: Hotspot[];
  /** A server-rendered scientific figure for the lab's principle. */
  figure: ReactNode;
}

interface LabExplorerProps {
  chapters: LabExplorerChapter[];
  labels: {
    nav: string;
    question: string;
    principle: string;
    lookCloser: string;
    hint: string;
    archival: string;
  };
}

/**
 * The laboratories as an exhibit walk. Desktop: the photograph of the lab
 * being read stays pinned (CSS sticky — scrolling is never intercepted) and
 * carries its hotspots; a chapter index tracks progress. Mobile and tablet:
 * each chapter is a self-contained stack with its own interactive photo.
 */
export function LabExplorer({ chapters, labels }: LabExplorerProps) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(index)) setActive(index);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const element of refs.current) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-20 lg:grid-cols-12 lg:gap-14">
      <div className="hidden lg:col-span-6 lg:block xl:col-span-7">
        <div className="sticky top-[calc(var(--mx-header-h)+1.5rem)]">
          <nav aria-label={labels.nav} className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
            {chapters.map((chapter, index) => (
              <a
                key={chapter.key}
                href={`#lab-${chapter.key}`}
                aria-current={index === active ? 'true' : undefined}
                className={cn(
                  'mx-mono-label inline-flex min-h-8 items-center gap-2 transition-colors duration-300',
                  index === active ? 'text-(--mx-fg)' : 'hover:text-(--mx-fg-2)',
                )}
              >
                <span className={cn('h-px transition-all duration-500', index === active ? 'w-6 bg-(--mx-mark)' : 'w-2 bg-(--mx-line-strong)')} />
                {String(index + 1).padStart(2, '0')} {chapter.name}
              </a>
            ))}
          </nav>
          <div className="relative">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.key}
                aria-hidden={index !== active}
                className={cn(
                  'transition-[opacity,clip-path] duration-[900ms] ease-(--mx-ease-out) motion-reduce:transition-none',
                  index === active
                    ? 'relative opacity-100 [clip-path:inset(0_0_0_0)]'
                    : 'pointer-events-none absolute inset-x-0 top-0 opacity-0 [clip-path:inset(0_0_100%_0)]',
                )}
              >
                <HotspotPlate
                  photo={chapter.photo}
                  alt={chapter.name}
                  hotspots={chapter.hotspots}
                  inert={index !== active}
                  sizes="(min-width: 1280px) 52vw, (min-width: 1024px) 46vw, 1px"
                  labels={{ lookCloser: labels.lookCloser, hint: labels.hint, archival: labels.archival }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ol className="grid gap-24 lg:col-span-6 lg:gap-0 xl:col-span-5">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.key}
            id={`lab-${chapter.key}`}
            ref={(element) => {
              refs.current[index] = element;
            }}
            data-index={index}
            className="scroll-mt-[calc(var(--mx-header-h)+2rem)] lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-16"
          >
            <HotspotPlate
              className="mb-10 lg:hidden"
              photo={chapter.photo}
              alt={chapter.name}
              hotspots={chapter.hotspots}
              sizes="(max-width: 1024px) 100vw, 1px"
              labels={{ lookCloser: labels.lookCloser, hint: labels.hint, archival: labels.archival }}
            />
            <p className="mx-mono-label text-(--mx-accent)">
              {String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
            </p>
            <h3 className="mx-h2 mt-3">{chapter.name}</h3>
            <p className="mx-eyebrow mt-8">{labels.question}</p>
            <p className="mx-lede mt-3 text-(--mx-fg)">{chapter.question}</p>
            <p className="mt-4 max-w-[46ch] text-(--mx-fg-2)">{chapter.text}</p>
            <div className="mt-10 border-t border-(--mx-line) pt-6">
              <p className="mx-mono-label mb-4">{labels.principle}</p>
              {chapter.figure}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
