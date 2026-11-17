'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useRef } from 'react';

export interface Milestone {
  year: string;
  text: string;
}

const EASE_OUT = [0.19, 1, 0.22, 1] as const;

/**
 * Vertical timeline whose rail is drawn by scrolling: the fill tracks the
 * reading position, and each milestone settles in as the line reaches it.
 * Reduced motion shows the completed timeline.
 */
export function MilestoneTimeline({ items, title }: { items: Milestone[]; title: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <div>
      <h3 className="mx-mono-label">{title}</h3>
      <ol ref={ref} className="relative mt-8 grid gap-10 pl-10 sm:gap-12">
        <span aria-hidden="true" className="absolute bottom-2 left-[0.6875rem] top-2 w-px bg-(--mx-line-strong)" />
        <motion.span
          aria-hidden="true"
          style={{ scaleY: reduce ? 1 : fill }}
          className="absolute bottom-2 left-[0.6875rem] top-2 w-px origin-top bg-[linear-gradient(var(--mx-teal),var(--mx-amber))]"
        />
        {items.map((item) => (
          <motion.li
            key={item.year}
            className="relative"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -30% 0px' }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <span
              aria-hidden="true"
              className="absolute -left-10 top-1.5 grid size-[1.375rem] place-items-center rounded-full border border-(--mx-line-strong) bg-(--mx-bg)"
            >
              <span className="size-2 rounded-full bg-(--mx-accent)" />
            </span>
            <p className="mx-numeric text-[clamp(1.75rem,1.3rem+1.6vw,2.6rem)] leading-none text-(--mx-fg)">{item.year}</p>
            <p className="mt-3 max-w-[46ch] text-(--mx-fg-2)">{item.text}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
