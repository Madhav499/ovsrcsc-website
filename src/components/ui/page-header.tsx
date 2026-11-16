import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
  tone?: 'light' | 'ink';
}

export function PageHeader({ eyebrow, title, intro, children, tone = 'light' }: PageHeaderProps) {
  const dark = tone === 'ink';
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b',
        dark ? 'border-cosmic bg-midnight text-warm-ivory' : 'border-line bg-paper text-midnight',
      )}
    >
      {/* MERIDIAN scientific grid */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          dark ? 'science-grid-dark opacity-60' : 'science-grid',
        )}
        aria-hidden="true"
      />
      {/* Architectural circles */}
      <div
        className={cn(
          'pointer-events-none absolute -right-40 -top-48 size-[32rem] rounded-full border',
          dark ? 'border-cyan/10' : 'border-line/60',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-16 -top-28 size-[20rem] rounded-full border',
          dark ? 'border-solar/15' : 'border-line/60',
        )}
        aria-hidden="true"
      />
      {/* Accent dot */}
      <div
        className={cn(
          'pointer-events-none absolute right-12 top-12 size-2 rounded-full',
          dark ? 'bg-solar shadow-[0_0_8px_#E9A94B]' : 'bg-solar',
        )}
        aria-hidden="true"
      />

      <div className="site-container relative py-14 lg:py-20">
        {eyebrow ? (
          <p className={cn('eyebrow', dark ? '!text-cyan' : '!text-solar')}>{eyebrow}</p>
        ) : null}
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h1
            className={cn(
              'display-title max-w-3xl text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.08]',
              dark ? 'text-white' : 'text-midnight',
            )}
          >
            {title}
          </h1>
          {intro || children ? (
            <div className={cn('max-w-xl', dark ? 'text-warm-ivory/70' : 'text-slate-muted')}>
              {intro ? <p className="text-[1.02rem] leading-relaxed">{intro}</p> : null}
              {children ? <div className="mt-5">{children}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
