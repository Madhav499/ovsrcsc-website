import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DrawOnView } from './draw-on-view';

interface DiagramProps {
  /** e.g. "Fig. 04" */
  figure?: string;
  caption?: ReactNode;
  /** Short text alternative describing what the diagram shows. */
  title: string;
  viewBox: string;
  children: ReactNode;
  className?: string;
  svgClassName?: string;
}

/**
 * A journal figure: an inline SVG diagram that draws itself on first view,
 * with a numbered caption. The SVG carries role="img" + <title>, so the
 * scientific content is never available only through animation.
 */
export function Diagram({ figure, caption, title, viewBox, children, className, svgClassName }: DiagramProps) {
  return (
    <DrawOnView as="figure" className={cn('min-w-0', className)}>
      <svg viewBox={viewBox} role="img" className={cn('mx-diagram block h-auto w-full', svgClassName)}>
        <title>{title}</title>
        {children}
      </svg>
      {caption ? (
        <figcaption className="mx-figcap">
          {figure ? <span className="mx-figcap-num">{figure}</span> : null}
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </DrawOnView>
  );
}

/** Small helper so every drawable path carries the same attributes. */
export function d(index: number) {
  return { pathLength: 1, style: { '--i': index } as React.CSSProperties };
}
