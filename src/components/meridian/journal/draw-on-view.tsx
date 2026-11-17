'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Draws the `.mx-draw` paths of its children (each with pathLength="1") the
 * first time it scrolls into view. Server HTML renders the finished drawing;
 * paths are only "armed" (hidden) on the client while still off-screen, so
 * no-JS visitors, reduced-motion visitors and anything already on screen at
 * load always see the complete figure.
 */
export function DrawOnView({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'figure';
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'static' | 'armed' | 'drawn'>('static');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) return;
    setState('armed');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('drawn');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLElement>}
      data-draw={state === 'static' ? undefined : state}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
