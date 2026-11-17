'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { distribute, padCount, PAGE_SIZE, type ArchiveAlbum, type ArchivePhoto } from './archive-model';
import { PhotoTile, tileSizes } from './photo-tile';
import { PhotoViewer, type ViewerLabels } from './photo-viewer';

export interface ArchiveLabels extends ViewerLabels {
  all: string;
  choose: string;
  open: string;
  loadMore: string;
  tools: string;
  grid: string;
  feature: string;
  albums: string;
  top: string;
  unavailable: string;
  empty: string;
  emptyNote: string;
  emptyAlbum: string;
}

interface GalleryArchiveProps {
  title: string;
  intro?: string;
  photos: ArchivePhoto[];
  albums: ArchiveAlbum[];
  /** Album pre-selected by the route (/gallery/[slug]); null = All. */
  initialAlbum: string | null;
  /** `/en/gallery` — category changes update the address bar to real routes. */
  basePath: string;
  labels: ArchiveLabels;
  emptyFigure?: ReactNode;
}

type View = 'grid' | 'feature';

/**
 * Photography-first archive (after the ViV MGMT portfolio pattern, adapted
 * to OVSRCSC): a large serif title, the active album as a large label with
 * its count, a typographic album index, a tight-gutter masonry at each
 * photo's true proportions, "Load more", a floating view toolbar and a
 * minimal full-screen viewer. Albums are the CMS's own grouping.
 */
export function GalleryArchive({ title, intro, photos, albums, initialAlbum, basePath, labels, emptyFigure }: GalleryArchiveProps) {
  const [album, setAlbum] = useState<string | null>(initialAlbum);
  const [indexOpen, setIndexOpen] = useState(false);
  const [view, setView] = useState<View>('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [viewer, setViewer] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const indexFirst = useRef<HTMLButtonElement>(null);
  const filterButton = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusAfterLoad = useRef<number | null>(null);

  const filtered = useMemo(() => (album ? photos.filter((photo) => photo.albums.includes(album)) : photos), [album, photos]);
  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;
  const canFilter = albums.length >= 2;
  const activeAlbum = albums.find((entry) => entry.slug === album) ?? null;
  const activeLabel = activeAlbum ? activeAlbum.title : labels.all;

  const choose = (slug: string | null) => {
    setAlbum(slug);
    setVisible(PAGE_SIZE);
    setIndexOpen(false);
    // Real routes: /gallery (All) and /gallery/[slug]; no reload, and a refresh lands on the same view.
    window.history.replaceState(null, '', slug ? `${basePath}/${slug}` : basePath);
    filterButton.current?.focus();
  };

  useEffect(() => {
    if (!indexOpen) return;
    indexFirst.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIndexOpen(false);
        filterButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [indexOpen]);

  // After "Load more", move keyboard focus to the first newly shown photograph.
  useEffect(() => {
    const target = focusAfterLoad.current;
    if (target === null) return;
    focusAfterLoad.current = null;
    const candidates = gridRef.current?.querySelectorAll<HTMLElement>(`[data-photo-index="${target}"]`) ?? [];
    for (const element of candidates) if (element.offsetParent !== null) element.focus();
  }, [visible]);

  const open = (index: number) => (element: HTMLButtonElement) => {
    opener.current = element;
    setViewer(index);
  };

  const tile = (photo: ArchivePhoto, index: number, sizes: string, className?: string) => (
    <div key={photo.id} data-photo-index={index} tabIndex={-1} className={cn('outline-none', className)}>
      <PhotoTile photo={photo} sizes={sizes} priority={index < 4} openLabel={labels.open} unavailableLabel={labels.unavailable} onOpen={open(index)} />
    </div>
  );

  const masonry = (columns: number, className: string) => (
    <div className={cn('mx-archive-masonry', className)} style={{ ['--cols' as string]: columns }}>
      {distribute(shown, columns).map((column, c) => (
        <div key={c} className="mx-archive-column">
          {column.map(({ photo, index }) => tile(photo, index, tileSizes('grid')))}
        </div>
      ))}
    </div>
  );

  return (
    <section aria-labelledby="archive-title" className="mx-surface-ivory mx-archive">
      {/* Header: title left, active album + count right (the album control) */}
      <div className="mx-archive-head">
        <div className="min-w-0">
          {intro ? <p className="mx-archive-intro">{intro}</p> : null}
          <h1 id="archive-title" className="mx-archive-title">
            {title}
          </h1>
        </div>
        {canFilter ? (
          <button
            ref={filterButton}
            type="button"
            className="mx-archive-filter"
            aria-expanded={indexOpen}
            aria-controls="archive-index"
            onClick={() => setIndexOpen((value) => !value)}
          >
            <span className="sr-only">{labels.choose}: </span>
            {indexOpen ? (
              labels.close
            ) : (
              <>
                <sup className="mx-archive-count">({padCount(filtered.length)})</sup>
                {activeLabel}
              </>
            )}
          </button>
        ) : (
          <p className="mx-archive-filter is-static">
            <sup className="mx-archive-count">({padCount(filtered.length)})</sup>
            {activeLabel}
          </p>
        )}
      </div>

      {indexOpen ? (
        <nav id="archive-index" aria-label={labels.choose} className="mx-archive-index">
          <ul>
            {[{ slug: null as string | null, title: labels.all, count: photos.length }, ...albums].map((entry, i) => (
              <li key={entry.slug ?? 'all'}>
                <button
                  ref={i === 0 ? indexFirst : undefined}
                  type="button"
                  aria-pressed={album === entry.slug}
                  onClick={() => choose(entry.slug)}
                  className="mx-archive-index-item"
                >
                  {entry.title}
                  <sup className="mx-archive-count">({padCount(entry.count)})</sup>
                </button>
                {i < albums.length ? <span aria-hidden="true" className="mx-archive-slash">/</span> : null}
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <div ref={gridRef} key={`${album ?? 'all'}-${view}`} className="mx-archive-body">
          {photos.length === 0 ? (
            <div className="mx-archive-empty">
              <p className="mx-archive-empty-line">{labels.empty}</p>
              <p className="mt-4 text-(--mx-fg-2)">{labels.emptyNote}</p>
              {emptyFigure ? <div className="mt-12 max-w-md">{emptyFigure}</div> : null}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-archive-empty">
              <p className="mx-archive-empty-line">{labels.emptyAlbum}</p>
            </div>
          ) : view === 'grid' ? (
            <>
              {masonry(2, 'sm:hidden')}
              {masonry(3, 'hidden sm:flex lg:hidden')}
              {masonry(4, 'hidden lg:flex')}
            </>
          ) : (
            <div className="mx-archive-feature">
              {shown.map((photo, index) => {
                const row = Math.floor(index / 2);
                const wide = (index % 2 === 1) === (row % 2 === 0);
                return tile(photo, index, tileSizes('feature', wide), cn('mx-archive-feature-cell', wide ? 'is-wide' : 'is-narrow'));
              })}
            </div>
          )}

          {remaining > 0 ? (
            <div className="mx-archive-more">
              <button
                type="button"
                className="mx-archive-more-btn"
                onClick={() => {
                  focusAfterLoad.current = shown.length;
                  setVisible((value) => value + PAGE_SIZE);
                }}
              >
                {labels.loadMore} <span className="mx-archive-count">({remaining})</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Floating toolbar (sticky inside the archive so it never covers the footer) */}
      {filtered.length > 0 ? (
        <div className="mx-archive-toolbar-wrap">
          <div role="toolbar" aria-label={labels.tools} className="mx-archive-toolbar">
            {canFilter ? (
              <>
                <button type="button" onClick={() => setIndexOpen(true)} aria-pressed={indexOpen} className="mx-archive-tool">
                  {labels.albums}
                </button>
                <span aria-hidden="true" className="mx-archive-tool-sep" />
              </>
            ) : null}
            {(['grid', 'feature'] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key && !indexOpen}
                onClick={() => {
                  setIndexOpen(false);
                  setView(key);
                }}
                className="mx-archive-tool"
              >
                <ViewIcon kind={key} />
                <span className="sr-only sm:not-sr-only">{key === 'grid' ? labels.grid : labels.feature}</span>
              </button>
            ))}
            <span aria-hidden="true" className="mx-archive-tool-sep" />
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mx-archive-tool" aria-label={labels.top}>
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <PhotoViewer photos={filtered} index={viewer} onIndex={setViewer} returnFocus={() => opener.current} labels={labels} />
    </section>
  );
}

/** The two view glyphs: a 2×2 grid, and a narrow + wide pair. */
function ViewIcon({ kind }: { kind: View }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2.5" fill="currentColor">
      {kind === 'grid' ? (
        <path d="M0 0h4v4H0zM6 0h4v4H6zM0 6h4v4H0zM6 6h4v4H6z" />
      ) : (
        <path d="M0 0h3.5v6H0zM5 0h5v10H5z" />
      )}
    </svg>
  );
}
