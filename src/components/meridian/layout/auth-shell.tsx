import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { OrbitMotif } from '@/components/meridian/visualizations/orbit-motif';

/** Quiet, focused frame for the staff password flows hosted under the public layout. */
export function AuthShell({
  eyebrow,
  title,
  body,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section data-mx-hero="dark" className="mx-surface-dark relative isolate overflow-hidden">
      <div aria-hidden="true" className="mx-atmosphere pointer-events-none absolute inset-0 -z-10" />
      <OrbitMotif
        variant="rings"
        className="pointer-events-none absolute -left-40 top-1/2 -z-10 hidden w-[40rem] -translate-y-1/2 text-(--mx-ivory) opacity-30 md:block"
      />
      <div className="mx-container mx-hero-offset flex min-h-[80svh] items-center justify-center pb-20">
        <div className="mx-surface-white w-full max-w-lg rounded-(--mx-radius-lg) p-7 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)] sm:p-10">
          <p className="mx-eyebrow">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mx-h3 mt-4">{title}</h1>
          {body ? <p className="mt-3 text-[0.9375rem] text-(--mx-fg-2)">{body}</p> : null}
          <div className="mt-8">{children}</div>
          <p className="mx-meta mt-8 border-t border-(--mx-line) pt-5">{note}</p>
        </div>
      </div>
    </section>
  );
}
