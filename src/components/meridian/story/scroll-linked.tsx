'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type CSSProperties, type ReactNode } from 'react';

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>['offset']>;
type Range = readonly [number, number];

interface ScrollLinkedProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Window of this element's own scroll journey that maps to 0 → 1. */
  offset?: ScrollOffset;
  /** Each range is [value at 0, value at 1]. Pixels for x/y. */
  x?: Range;
  y?: Range;
  scale?: Range;
  opacity?: Range;
  rotate?: Range;
  /**
   * Which end is the readable resting state under reduced motion: 'end' for
   * entrances (default), 'start' for exits such as the hero leaving.
   */
  rest?: 'start' | 'end';
}

const PASS_THROUGH: ScrollOffset = ['start end', 'end start'];

/**
 * Binds transform/opacity to the element's own scroll position. Values are
 * motion values, so scrolling never re-renders React. Under reduced motion
 * the element rests at its readable state (`rest`) and stays fully opaque.
 */
export function ScrollLinked({
  children,
  className,
  style,
  offset = PASS_THROUGH,
  x = [0, 0],
  y = [0, 0],
  scale = [1, 1],
  opacity = [1, 1],
  rotate = [0, 0],
  rest: restAt = 'end',
}: ScrollLinkedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const settle = restAt === 'start' ? 0 : 1;
  const rest = (range: Range) => (reduce ? [range[settle], range[settle]] : [range[0], range[1]]);
  const motionX = useTransform(scrollYProgress, [0, 1], rest(x));
  const motionY = useTransform(scrollYProgress, [0, 1], rest(y));
  const motionScale = useTransform(scrollYProgress, [0, 1], rest(scale));
  const motionOpacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [opacity[0], opacity[1]]);
  const motionRotate = useTransform(scrollYProgress, [0, 1], rest(rotate));

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        x: motionX,
        y: motionY,
        scale: motionScale,
        opacity: motionOpacity,
        rotate: motionRotate,
      }}
    >
      {children}
    </motion.div>
  );
}
