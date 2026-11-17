import { cn } from '@/lib/utils';

interface OrbitMotifProps {
  className?: string;
  /** 'atom' echoes the three tilted orbits of the official logo. */
  variant?: 'atom' | 'rings' | 'meridian';
  animated?: boolean;
  /** Atom only: highlights one part and dims the rest. */
  focus?: 'nucleus' | 'electrons' | 'orbits' | null;
}

/**
 * Lightweight SVG scientific motif. Pure CSS animation (disabled under
 * prefers-reduced-motion). Also serves as the static fallback for the 3D hero.
 */
export function OrbitMotif({ className, variant = 'atom', animated = true, focus = null }: OrbitMotifProps) {
  if (variant === 'rings') {
    return (
      <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className={className}>
        <g stroke="currentColor" strokeWidth="0.75" opacity="0.5">
          <circle cx="200" cy="200" r="190" strokeDasharray="2 6" />
          <circle cx="200" cy="200" r="140" />
          <circle cx="200" cy="200" r="90" strokeDasharray="1 4" />
        </g>
        <g className={cn(animated && 'mx-orbit-spin')}>
          <circle cx="200" cy="10" r="4" fill="var(--mx-amber)" />
          <circle cx="340" cy="200" r="2.5" fill="var(--mx-cyan)" />
        </g>
        <g className={cn(animated && 'mx-orbit-spin-reverse')}>
          <circle cx="110" cy="200" r="3" fill="var(--mx-teal)" />
        </g>
      </svg>
    );
  }

  if (variant === 'meridian') {
    return (
      <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className={className}>
        <g stroke="currentColor" strokeWidth="0.75" opacity="0.45">
          <circle cx="200" cy="200" r="180" />
          <ellipse cx="200" cy="200" rx="180" ry="60" />
          <ellipse cx="200" cy="200" rx="180" ry="120" strokeDasharray="1 5" />
          <ellipse cx="200" cy="200" rx="60" ry="180" />
          <ellipse cx="200" cy="200" rx="120" ry="180" strokeDasharray="1 5" />
          <line x1="20" y1="200" x2="380" y2="200" />
          <line x1="200" y1="20" x2="200" y2="380" />
        </g>
        <circle cx="200" cy="200" r="3" fill="var(--mx-amber)" />
        <g className={cn(animated && 'mx-orbit-spin')}>
          <circle cx="200" cy="20" r="3.5" fill="var(--mx-cyan)" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true" className={cn('mx-atom', className)} data-focus={focus ?? undefined}>
      <defs>
        <radialGradient id="mx-nucleus" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="45%" stopColor="#e3cfae" />
          <stop offset="100%" stopColor="#7a5b32" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="196" stroke="currentColor" strokeWidth="0.6" opacity="0.18" strokeDasharray="2 7" />
      <g className={cn(animated && 'mx-orbit-spin')}>
        <g transform="rotate(-30 200 200)">
          <ellipse cx="200" cy="200" rx="170" ry="58" stroke="var(--mx-cyan)" strokeWidth="1.2" opacity="0.75" className="mx-atom-orbit" />
          <circle cx="370" cy="200" r="7" fill="var(--mx-cyan)" className="mx-atom-electron" />
        </g>
        <g transform="rotate(30 200 200)">
          <ellipse cx="200" cy="200" rx="170" ry="58" stroke="var(--mx-teal)" strokeWidth="1.2" opacity="0.75" className="mx-atom-orbit" />
          <circle cx="58" cy="166" r="6" fill="var(--mx-teal)" className="mx-atom-electron" />
        </g>
        <g transform="rotate(90 200 200)">
          <ellipse cx="200" cy="200" rx="170" ry="58" stroke="var(--mx-amber)" strokeWidth="1.2" opacity="0.8" className="mx-atom-orbit" />
          <circle cx="330" cy="237" r="6.5" fill="var(--mx-amber)" className="mx-atom-electron" />
        </g>
      </g>
      <circle cx="200" cy="200" r="26" fill="url(#mx-nucleus)" className="mx-atom-nucleus" />
      <circle cx="200" cy="200" r="40" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
    </svg>
  );
}
