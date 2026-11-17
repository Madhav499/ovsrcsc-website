'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * A continuous line that runs down the page's left gutter and is drawn as
 * the reader scrolls — the trace a chart recorder makes under a swinging
 * pendulum (a damped sine, re-excited at each chapter). Decorative and
 * large-screen only; it never captures pointer events.
 */
export function JournalThread({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [height, setHeight] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'end 0.9'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const d = useMemo(() => {
    if (!height) return '';
    const points: string[] = [];
    const chapter = 1400; // the swing is re-excited roughly once per chapter
    for (let y = 0; y <= height; y += 6) {
      const t = (y % chapter) / chapter;
      const amplitude = 11 * Math.exp(-3.2 * t) + 1.2;
      const x = 20 + amplitude * Math.sin((2 * Math.PI * y) / 210);
      points.push(`${points.length ? 'L' : 'M'} ${x.toFixed(1)} ${y}`);
    }
    return points.join(' ');
  }, [height]);

  return (
    <div ref={ref} className="relative">
      {children}
      {d ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-[max(0px,calc((100vw-88rem)/2))] top-0 z-[5] hidden h-full w-10 overflow-visible lg:block"
          viewBox={`0 0 40 ${height}`}
          preserveAspectRatio="none"
        >
          <path d={d} fill="none" stroke="var(--mx-line-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />
          <motion.path
            d={d}
            fill="none"
            stroke="var(--mx-brass)"
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            style={{ pathLength: reduce ? 1 : progress }}
          />
        </svg>
      ) : null}
    </div>
  );
}
