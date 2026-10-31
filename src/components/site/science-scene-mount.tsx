'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ScienceScene = dynamic(() => import('./science-scene'), {
  ssr: false,
  loading: () => null,
});

export function ScienceSceneMount({ className }: { className?: string }) {
  const [animate, setAnimate] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAnimate(!media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  if (visible && animate !== null) {
    return (
      <div ref={setElement} className={className}>
        <ScienceScene animate={animate} className="size-full" />
      </div>
    );
  }
  return <div ref={setElement} className={className} aria-hidden="true" />;
}
