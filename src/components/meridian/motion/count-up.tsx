'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  /** BCP-47 tag used for digit formatting, e.g. 'gu-IN-u-nu-gujr'. */
  numberLocale: string;
  suffix?: string;
  durationSeconds?: number;
}

/**
 * Restrained count-up. The final figure is server-rendered (readable without
 * JavaScript and by crawlers); the animation only runs for figures that start
 * off-screen, so visitors never see a number jump backwards.
 */
export function CountUp({ value, numberLocale, suffix = '', durationSeconds = 1.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const armed = useRef(false);
  const format = (n: number) => new Intl.NumberFormat(numberLocale).format(Math.round(n));

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion) return;
    const rect = element.getBoundingClientRect();
    const offscreen = rect.top > window.innerHeight || rect.bottom < 0;
    if (offscreen) {
      armed.current = true;
      setDisplay(0);
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!inView || !armed.current) return;
    armed.current = false;
    const controls = animate(0, value, {
      duration: durationSeconds,
      ease: [0.19, 1, 0.22, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, durationSeconds]);

  return (
    <span ref={ref} aria-label={`${format(value)}${suffix}`}>
      <span aria-hidden="true">
        {format(display)}
        {suffix}
      </span>
    </span>
  );
}
