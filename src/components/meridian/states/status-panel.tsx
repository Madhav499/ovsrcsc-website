import type { ReactNode } from 'react';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

/** Full-height dark panel used by the 404 and error boundaries. */
export function StatusPanel({
  code,
  title,
  body,
  actions,
}: {
  code: string;
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <section data-mx-hero="dark" className="mx-surface-dark relative isolate overflow-hidden">
      <div aria-hidden="true" className="mx-atmosphere pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden="true" className="mx-starfield pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <OrbitMotif
        variant="atom"
        className="pointer-events-none absolute -right-24 top-1/2 -z-10 w-[30rem] -translate-y-1/2 text-(--mx-ivory) opacity-40 sm:w-[44rem] lg:right-0"
      />
      <div className="mx-container mx-hero-offset flex min-h-[86svh] items-center pb-20">
        <div className="max-w-2xl">
          <p className="mx-numeric text-[clamp(5rem,3rem+9vw,11rem)] leading-none text-(--mx-amber)">{code}</p>
          <h1 className="mx-h1 mt-6">{title}</h1>
          <p className="mx-body-lg mt-6 max-w-xl">{body}</p>
          <div className="mt-10 flex flex-wrap gap-3">{actions}</div>
        </div>
      </div>
    </section>
  );
}
