import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  accent?: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'h1' | 'h2' | 'h3';
  align?: 'start' | 'split';
  className?: string;
  id?: string;
}

/**
 * Editorial section opener: numbered eyebrow, display title with an optional
 * serif accent phrase, supporting intro and an optional trailing action.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  intro,
  action,
  as: Heading = 'h2',
  size = 'h2',
  align = 'start',
  className,
  id,
}: SectionHeadingProps) {
  const sizeClass = size === 'h1' ? 'mx-h1' : size === 'h3' ? 'mx-h3' : 'mx-h2';
  return (
    <div
      className={cn(
        'grid gap-6',
        align === 'split' && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mx-eyebrow">
            {index ? <span className="mx-eyebrow-index">{index}</span> : null}
            {index ? <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <Heading id={id} className={cn(sizeClass, eyebrow && 'mt-5', 'max-w-[18ch]')}>
          {title}
          {accent ? (
            <>
              {' '}
              <span className="mx-serif-accent">{accent}</span>
            </>
          ) : null}
        </Heading>
      </div>
      {intro || action ? (
        <div className="flex min-w-0 flex-col items-start gap-6">
          {intro ? <div className="mx-body-lg max-w-xl">{intro}</div> : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
