'use client';

import { useState, type ReactNode } from 'react';
import { EditorialArchive } from './editorial-archive';
import { LightboxGallery, type LightboxItem, type LightboxLabels } from './lightbox-gallery';

/**
 * Album viewer with two real layouts: the editorial sequence (reading) and a
 * contact sheet (scanning every frame at once). Both open the same viewer.
 */
export function ArchiveViews({
  items,
  labels,
  dateline,
  marginFigure,
  plateLabel,
  viewLabels,
}: {
  items: LightboxItem[];
  labels: LightboxLabels;
  dateline?: string;
  marginFigure?: ReactNode;
  plateLabel: string;
  viewLabels: { group: string; editorial: string; sheet: string };
}) {
  const [view, setView] = useState<'editorial' | 'sheet'>('editorial');
  return (
    <div>
      <div role="group" aria-label={viewLabels.group} className="mb-12 flex items-center gap-2 border-b border-(--mx-line) pb-5">
        <span className="mx-mono-label mr-3">{viewLabels.group}</span>
        {(['editorial', 'sheet'] as const).map((key) => (
          <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className="mx-chip">
            {key === 'editorial' ? viewLabels.editorial : viewLabels.sheet}
          </button>
        ))}
      </div>
      {view === 'editorial' ? (
        <EditorialArchive items={items} labels={labels} dateline={dateline} marginFigure={marginFigure} plateLabel={plateLabel} />
      ) : (
        <LightboxGallery items={items} labels={labels} />
      )}
    </div>
  );
}
