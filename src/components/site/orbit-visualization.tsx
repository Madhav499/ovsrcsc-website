'use client';

import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OrbitVisualizationProps {
  className?: string;
  /** Number of orbital rings */
  rings?: number;
  /** Show the central nucleus */
  showNucleus?: boolean;
  /** Whether to animate the orbits */
  animate?: boolean;
}

/**
 * Scientific orbital visualization — CSS-only animated orbits.
 * Lightweight, performant, respects prefers-reduced-motion.
 */
export function OrbitVisualization({
  className,
  rings = 3,
  showNucleus = true,
  animate = true,
}: OrbitVisualizationProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  const ringConfigs = [
    { size: '100%', rotation: -28, speed: 40, scale: 1, dotAngle: 0 },
    { size: '72%', rotation: 18, speed: 55, scale: 0.85, dotAngle: 120 },
    { size: '55%', rotation: -50, speed: 35, scale: 0.7, dotAngle: 240 },
    { size: '88%', rotation: 70, speed: 48, scale: 0.9, dotAngle: 60 },
  ];

  return (
    <div className={cn('relative', className)} aria-hidden="true">
      {Array.from({ length: Math.min(rings, ringConfigs.length) }).map((_, i) => {
        const config = ringConfigs[i];
        return (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotate(${config.rotation}deg) scale(${config.scale})`,
            }}
          >
            <div
              className={cn(
                'relative rounded-full border border-stone/25',
                shouldAnimate && 'animate-[slowRotate_var(--speed)_linear_infinite]',
              )}
              style={{
                width: config.size,
                height: config.size,
                ['--speed' as string]: `${config.speed}s`,
              }}
            >
              {/* Orbital body */}
              <div
                className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brass"
                style={{
                  opacity: 0.7 - i * 0.12,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Central nucleus */}
      {showNucleus ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative grid size-12 place-items-center">
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-brass/8',
                shouldAnimate && 'animate-[orbitPulse_4s_ease-in-out_infinite]',
              )}
            />
            <div className="size-4 rounded-full bg-brass shadow-[0_0_12px_rgba(165,139,98,0.4)]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
