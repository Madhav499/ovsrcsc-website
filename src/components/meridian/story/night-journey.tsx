'use client';

import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ScrollLinked } from './scroll-linked';

export interface NightPanel {
  key: string;
  photo: StaticImageData;
  caption: string;
  fact: string;
}

interface NightJourneyProps {
  intro: ReactNode;
  dusk: string;
  hint: string;
  panels: NightPanel[];
  figureLabel: string;
  cta: { href: string; label: string };
  closing: string;
}

const PANEL = 'w-[min(82vw,30rem)] shrink-0 snap-start lg:w-[clamp(24rem,30vw,32rem)]';

/**
 * Day turns to night, then the astronomy club's year unfolds sideways.
 * On large screens the row is pinned (CSS sticky) and translated by the
 * page's own vertical scroll — scrolling is never intercepted, and the
 * section's height equals the horizontal distance, so the mapping is 1:1.
 * Phones and reduced-motion visitors get a native swipeable row instead.
 */
export function NightJourney({ intro, dusk, hint, panels, figureLabel, cta, closing }: NightJourneyProps) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const distance = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: outer, offset: ['start start', 'end end'] });
  const x = useTransform(() => -scrollYProgress.get() * distance.get());

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const measure = () => {
      const enabled = query.matches && !reduce;
      setPinned(enabled);
      const element = track.current;
      if (!enabled || !element) {
        distance.set(0);
        setHeight(null);
        return;
      }
      const travel = Math.max(0, element.scrollWidth - window.innerWidth);
      distance.set(travel);
      setHeight(travel + window.innerHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (track.current) observer.observe(track.current);
    query.addEventListener('change', measure);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      query.removeEventListener('change', measure);
      window.removeEventListener('resize', measure);
    };
  }, [reduce, distance]);

  /* Keyboard users: bring a focused panel into view by scrolling the page. */
  const onFocus = (event: FocusEvent<HTMLOListElement>) => {
    const wrapper = outer.current;
    const travel = distance.get();
    if (!pinned || !wrapper || travel <= 0) return;
    const item = (event.target as HTMLElement).closest('li');
    if (!item) return;
    const progress = Math.min(1, Math.max(0, (item.offsetLeft - window.innerWidth * 0.15) / travel));
    const top = wrapper.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + progress * (wrapper.offsetHeight - window.innerHeight), behavior: 'instant' });
  };

  return (
    <>
      {/* Dusk: the light changes as the visitor scrolls into the night. */}
      <div className="relative isolate h-[70svh] min-h-[28rem] overflow-clip bg-[linear-gradient(180deg,var(--mx-white)_0%,#f4dcb4_24%,#d98f52_44%,#4a3d5c_66%,var(--mx-midnight)_92%)]">
        <ScrollLinked
          className="absolute left-1/2 top-[14%] -ml-16 size-32 rounded-full bg-[radial-gradient(circle,#fff1cf_0%,var(--mx-amber-bright)_45%,rgb(233_169_75/0)_72%)]"
          offset={['start end', 'end start']}
          y={[0, 300]}
          scale={[1, 1.25]}
        />
        <ScrollLinked className="absolute inset-0" offset={['start 0.6', 'end 0.4']} opacity={[0, 1]}>
          <div aria-hidden="true" className="mx-starfield absolute inset-x-0 bottom-0 h-3/5 opacity-80" />
        </ScrollLinked>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(transparent,var(--mx-midnight))]" />
        <p className="mx-h3 absolute inset-x-0 bottom-[12%] mx-auto max-w-[24ch] px-6 text-center text-(--mx-ivory)">{dusk}</p>
      </div>

      <div ref={outer} className="relative" style={height ? { height } : undefined}>
        <div className={cn('relative isolate', pinned && 'sticky top-0 flex h-[100svh] items-center overflow-clip')}>
          <div aria-hidden="true" className="mx-starfield pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <motion.ol
            ref={track}
            onFocus={onFocus}
            style={pinned ? { x } : undefined}
            className={cn(
              'flex gap-5 px-(--mx-gutter) py-[var(--mx-space-section)] lg:gap-8',
              pinned ? 'w-max pt-[calc(var(--mx-header-h)+2rem)] will-change-transform' : 'snap-x snap-mandatory scroll-px-(--mx-gutter) overflow-x-auto overscroll-x-contain',
            )}
          >
            <li className={cn(PANEL, 'flex flex-col justify-center lg:w-[clamp(26rem,34vw,36rem)] lg:pr-8')}>
              {intro}
              {pinned ? <p className="mx-mono-label mt-10">{hint} →</p> : null}
            </li>
            {panels.map((panel, index) => (
              <li key={panel.key} className={PANEL}>
                <figure>
                  <div className="mx-plate relative aspect-[4/5] overflow-hidden">
                    <Image src={panel.photo} alt={panel.caption} fill placeholder="blur" sizes="(max-width: 1024px) 82vw, 32vw" className="object-cover" />
                    <span aria-hidden="true" className="mx-ticks" />
                  </div>
                  <figcaption className="mt-4">
                    <span className="mx-mono-label text-(--mx-cyan)">
                      {figureLabel} {String(index + 1).padStart(2, '0')} · {panel.caption}
                    </span>
                    <p className="mt-3 text-(--mx-fg-2)">{panel.fact}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
            <li className={cn(PANEL, 'flex flex-col justify-center')}>
              <p className="mx-lede text-(--mx-fg)">{closing}</p>
              <Link href={cta.href} className="mx-btn mx-btn-light mt-8 self-start">
                {cta.label}
                <ArrowRight className="mx-btn-icon" aria-hidden="true" />
              </Link>
            </li>
          </motion.ol>
        </div>
      </div>
    </>
  );
}
