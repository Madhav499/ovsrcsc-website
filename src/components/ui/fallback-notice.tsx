import { Languages } from 'lucide-react';

export function FallbackNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-saffron/35 bg-saffron-light px-4 py-3 text-sm text-saffron-dark">
      <Languages className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
