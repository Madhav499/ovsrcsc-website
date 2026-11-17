'use client';

import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LabChapter {
  key: string;
  name: string;
  question: string;
  text: string;
  photo: StaticImageData;
  /** Optional in-page call to action, e.g. the pendulum experiment. */
  action?: { href: string; label: string };
}

interface LabChaptersProps {
  chapters: LabChapter[];
  labels: { question: string; figure: string; all: string };
  allHref: string;
}

/**
 * Pinned storytelling on large screens: the photograph stays in place (CSS
 * sticky — normal scrolling is never intercepted) while the chapters scroll
 * past and the plate cross-fades to the laboratory being read. The active
 * chapter changes at most five times per pass, so React state is cheap here.
 * Small screens get a natural stacked sequence with each chapter's photo.
 */
export function LabChapters({ chapters, labels, allHref }: LabChaptersProps) {
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
      { rootMargin: '-48% 0px -48% 0px' },
    );
    for (const element of refs.current) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
      {/* Pinned plate (large screens) */}
      <div className="hidden lg:col-span-7 lg:block">
        <div className="sticky top-[calc(var(--mx-header-h)+1.5rem)] h-[calc(100svh-var(--mx-header-h)-3rem)] max-h-[48rem]">
          <figure className="mx-plate relative size-full overflow-hidden">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.key}
                aria-hidden={index !== active}
                className={cn(
                  'absolute inset-0 transition-[opacity,transform,clip-path] duration-[1100ms] ease-(--mx-ease-out) motion-reduce:transition-none',
                  index === active
                    ? 'scale-100 opacity-100 [clip-path:inset(0_0_0_0)]'
                    : index < active
                      ? 'scale-[1.04] opacity-0 [clip-path:inset(0_0_100%_0)]'
                      : 'scale-[1.08] opacity-0 [clip-path:inset(100%_0_0_0)]',
                )}
              >
                <Image
                  src={chapter.photo}
                  alt={index === active ? chapter.name : ''}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 56vw, 1px"
                  className="object-cover"
                />
              </div>
            ))}
            <span aria-hidden="true" className="mx-ticks" />
            <div aria-hidden="true" className="mx-scrim absolute inset-x-0 bottom-0 h-1/2" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 text-(--mx-ivory)">
              <span>
                <span className="mx-mono-label block text-(--mx-cyan)">
                  {labels.figure} {String(active + 1).padStart(2, '0')}
                </span>
                <span className="mx-h4 mt-2 block">{chapters[active]?.name}</span>
              </span>
              <span aria-hidden="true" className="flex gap-1.5 pb-2">
                {chapters.map((chapter, index) => (
                  <span
                    key={chapter.key}
                    className={cn(
                      'h-1 rounded-full bg-(--mx-ivory) transition-all duration-500 motion-reduce:transition-none',
                      index === active ? 'w-8 opacity-100' : 'w-2 opacity-40',
                    )}
                  />
                ))}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* Chapters */}
      <ol className="grid gap-16 lg:col-span-5 lg:gap-0">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.key}
            ref={(element) => {
              refs.current[index] = element;
            }}
            data-index={index}
            className={cn(
              'flex flex-col justify-center transition-opacity duration-500 motion-reduce:transition-none lg:min-h-[72svh]',
              // Active chapter is marked by the plate and index, not by dimming text
              // (dimmed text would fail WCAG contrast).
            )}
          >
            <div className="mx-plate relative mb-7 aspect-[16/10] lg:hidden">
              <Image src={chapter.photo} alt="" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 1px" className="object-cover" />
              <span aria-hidden="true" className="mx-ticks" />
            </div>
            <p className="mx-mono-label text-(--mx-accent)">
              {String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
            </p>
            <h3 className="mx-h3 mt-3">{chapter.name}</h3>
            <p className="mx-eyebrow mt-8">{labels.question}</p>
            <p className="mx-lede mt-3 text-(--mx-fg)">{chapter.question}</p>
            <p className="mt-4 max-w-[44ch] text-(--mx-fg-2)">{chapter.text}</p>
            {chapter.action ? (
              <a href={chapter.action.href} className="mx-link mt-6 self-start">
                {chapter.action.label}
                <ArrowDown className="mx-btn-icon" aria-hidden="true" />
              </a>
            ) : null}
            {index === chapters.length - 1 ? (
              <Link href={allHref} className="mx-btn mx-btn-ink mt-10 self-start">
                {labels.all}
                <ArrowRight className="mx-btn-icon" aria-hidden="true" />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
