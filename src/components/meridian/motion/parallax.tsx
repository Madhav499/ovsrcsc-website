'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/**
 * Gentle scroll-linked vertical drift for imagery. `strength` is the total
 * travel in pixels across the element's pass through the viewport.
 */
export function Parallax({
  children,
  className,
  strength = 60,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const range = reduceMotion ? 0 : strength / 2;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="relative size-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
