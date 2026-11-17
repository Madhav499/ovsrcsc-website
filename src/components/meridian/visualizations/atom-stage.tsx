'use client';

import dynamic from 'next/dynamic';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AtomControls, AtomFocus } from './atom-scene';
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

export type Capability = 'pending' | 'static' | 'css' | 'webgl';

export function detectCapability(): Capability {
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

interface AtomStageProps {
  className?: string;
  /** 0 → 1 as the hero scrolls away; drives the atom's transformation. */
  progress?: MotionValue<number>;
  focus?: AtomFocus;
  controls?: AtomControls;
  onCapability?: (capability: Capability) => void;
}

/**
 * Progressive hero visual. The SVG atom is server-rendered (instant paint,
 * no layout shift). On capable desktop devices the WebGL atom loads lazily
 * and cross-fades in; it pauses when scrolled out of view. Small screens,
 * save-data, low-power devices and reduced-motion users keep the SVG, which
 * follows the same scroll progress and drag input with cheap 2D transforms.
 */
export function AtomStage({ className, progress, focus = null, controls, onCapability }: AtomStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [capability, setCapability] = useState<Capability>('pending');
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();

  const zero = useMotionValue(0);
  const scroll = progress ?? zero;
  const yaw = controls?.yaw ?? zero;
  const svgRotate = useTransform(() => (reduceMotion ? 0 : scroll.get() * 50) + (yaw.get() * 180) / Math.PI);
  const svgScale = useTransform(scroll, [0, 1], [1, reduceMotion ? 1 : 1.18]);

  useEffect(() => {
    const detected = detectCapability();
    setCapability(detected);
    onCapability?.(detected);
  }, [onCapability]);

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
      <motion.div
        style={{ rotate: svgRotate, scale: svgScale }}
        className={cn(
          'absolute inset-0 transition-opacity duration-1000 will-change-transform',
          useWebGL && ready ? 'opacity-0' : 'opacity-100',
        )}
      >
        <OrbitMotif
          variant="atom"
          focus={focus}
          animated={capability === 'css' || capability === 'pending'}
          className="size-full text-(--mx-ivory)"
        />
      </motion.div>
      {useWebGL ? (
        <div className={cn('absolute inset-0 transition-opacity duration-1000', ready ? 'opacity-100' : 'opacity-0')}>
          <WebGLBoundary onError={() => setFailed(true)}>
            <AtomScene
              animate
              active={visible}
              focus={focus}
              progress={progress}
              controls={controls}
              onReady={() => setReady(true)}
            />
          </WebGLBoundary>
        </div>
      ) : null}
    </div>
  );
}
