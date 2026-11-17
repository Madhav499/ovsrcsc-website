'use client';

import { MapPinned } from 'lucide-react';
import { useState } from 'react';

/**
 * Click-to-load map. Nothing is requested from Google until the visitor asks,
 * which keeps the page fast and avoids a third-party request on page load.
 */
export function MapConsent({ query, labels }: { query: string; labels: { load: string; note: string; frame: string } }) {
  const [shown, setShown] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className="mx-surface-stone mx-grain relative aspect-[4/3] overflow-hidden rounded-(--mx-radius-md) border border-(--mx-line) sm:aspect-[16/9]">
      {shown ? (
        <iframe
          title={labels.frame}
          src={src}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          {/* A survey graticule as the placeholder, not a fake map */}
          <svg aria-hidden="true" viewBox="0 0 400 225" className="absolute inset-0 size-full text-(--mx-fg) opacity-25" preserveAspectRatio="xMidYMid slice">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={225} stroke="currentColor" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 56} x2={400} y2={i * 56} stroke="currentColor" strokeWidth={0.5} />
            ))}
            <circle cx={200} cy={112} r={34} fill="none" stroke="var(--mx-brass)" strokeWidth={1} />
            <circle cx={200} cy={112} r={3} fill="var(--mx-brass)" />
          </svg>
          <div className="relative flex max-w-sm flex-col items-center gap-3">
            <button type="button" className="mx-btn mx-btn-primary" onClick={() => setShown(true)}>
              <MapPinned className="mx-btn-icon" aria-hidden="true" />
              {labels.load}
            </button>
            <p className="text-[0.8125rem] text-(--mx-fg-2)">{labels.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
