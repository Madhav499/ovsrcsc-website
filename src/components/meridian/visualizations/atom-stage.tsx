'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { OrbitMotif } from './orbit-motif';

const AtomScene = dynamic(() => import('./atom-scene'), { ssr: false, loading: () => null });

class WebGLBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Capability = 'pending' | 'static' | 'css' | 'webgl';

function detectCapability(): Capability {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return 'static';
  if (window.matchMedia('(max-width: 767px)').matches) return 'css';
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return 'css';
  if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) return 'css';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return 'css';
  } catch {
    return 'css';
  }
  return 'webgl';
}

/**
 * Progressive hero visual. The SVG atom is server-rendered (instant paint,
 * no layout shift). On capable desktop devices the WebGL atom loads lazily
 * and cross-fades in; it pauses when scrolled out of view. Small screens,
 * save-data, low-power devices and reduced-motion users keep the SVG.
 */
export function AtomStage({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [capability, setCapability] = useState<Capability>('pending');
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCapability(detectCapability());
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: '80px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const useWebGL = capability === 'webgl' && !failed;

  return (
    <div ref={ref} className={cn('relative', className)} aria-hidden="true">
      <OrbitMotif
        variant="atom"
        animated={capability === 'css' || capability === 'pending'}
        className={cn(
          'absolute inset-0 size-full text-(--mx-ivory) transition-opacity duration-1000',
          useWebGL && ready ? 'opacity-0' : 'opacity-100',
        )}
      />
      {useWebGL ? (
        <div className={cn('absolute inset-0 transition-opacity duration-1000', ready ? 'opacity-100' : 'opacity-0')}>
          <WebGLBoundary onError={() => setFailed(true)}>
            <AtomScene animate active={visible} onReady={() => setReady(true)} />
          </WebGLBoundary>
        </div>
      ) : null}
    </div>
  );
}
