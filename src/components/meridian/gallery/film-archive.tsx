'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMotionValue } from 'framer-motion';
import type { LocaleCode } from '@/lib/constants';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { FilmLabels } from './archive-data';
import { FilmFrame } from './film-frame';
import { exposed, frameNumber, layoutStrip, nearestExposure, thumbUrl, type ArchiveAlbum, type ArchivePhoto } from './film-model';
import { PhotoProject } from './photo-project';
import { useScramble } from './use-scramble';

const FilmStripGL = dynamic(() => import('./film-strip-gl'), { ssr: false, loading: () => null });

class GLBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type View = 'strip' | 'index';
type Mode = 'pending' | 'gl' | 'dom';

function detectMode(): Mode {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'dom';
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 2) return 'dom';
  // Low-powered touch devices get the native strip instead of continuous WebGL.
  if (window.matchMedia('(pointer: coarse)').matches && (navigator.hardwareConcurrency ?? 8) <= 4) return 'dom';
  try {
    const canvas = document.createElement('canvas');
    if (!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))) return 'dom';
  } catch {
    return 'dom';
  }
  return 'gl';
}

interface Props {
  photos: ArchivePhoto[];
  albums: ArchiveAlbum[];
  initialAlbum: string | null;
  initialView: View;
  initialPhoto: string | null;
  basePath: string;
  labels: FilmLabels;
  locale: LocaleCode;
}

/**
 * The OVSRCSC photo archive, after HOLMCHROME's film-roll browsing: a roll of
 * exposures that advances as you scroll (never hijacking the page), a light
 * table index, and a dark viewing room the selected frame is brought into.
 * Entirely driven by published CMS albums — no fixed counts or positions.
 */
/**
 * Page-scroll range (document coordinates) during which the sticky stage is
 * held: from the moment it reaches its sticky top (immediately, when the roll
 * starts under the fixed header) until the end of the roll releases it.
 */
function rollScrollRange(section: HTMLElement, gate: HTMLElement): { start: number; end: number } {
  const stickTop = parseFloat(getComputedStyle(gate).top) || 0;
  const docTop = section.getBoundingClientRect().top + window.scrollY;
  const start = Math.max(0, docTop - stickTop);
  const end = docTop - stickTop + section.offsetHeight - gate.offsetHeight;
  return { start, end: Math.max(start, end) };
}

export function FilmArchive({ photos, albums, initialAlbum, initialView, initialPhoto, basePath, labels, locale }: Props) {
  const [album, setAlbum] = useState<string | null>(initialAlbum);
  const [view, setView] = useState<View>(initialView);
  const [mode, setMode] = useState<Mode>('pending');
  const [glReady, setGlReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState<{ photo: number; x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [viewer, setViewer] = useState<{ index: number | null; origin: DOMRect | null; from: number | null }>({ index: null, origin: null, from: null });
  const roll = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const position = useMotionValue(0);

  const filtered = useMemo(() => (album ? photos.filter((photo) => photo.albums.includes(album)) : photos), [album, photos]);
  const frames = useMemo(() => layoutStrip(filtered), [filtered]);
  const exposures = useMemo(() => exposed(frames), [frames]);
  const glPhotos = useMemo(() => filtered.map((photo) => ({ url: thumbUrl(photo.storageKey, 1080) })), [filtered]);
  const activeAlbum = albums.find((entry) => entry.slug === album) ?? null;
  const travel = Math.max(0, exposures.length - 1);
  const perFrame = exposures.length > 60 ? 30 : 46; // svh of scrolling per frame

  useEffect(() => setMode(detectMode()), []);

  // URL reflects the view and the open photograph (real routes; no reload).
  const writeUrl = useCallback(
    (next: { album?: string | null; view?: View; photo?: string | null }) => {
      const url = new URL(window.location.href);
      const slug = next.album === undefined ? album : next.album;
      url.pathname = slug ? `${basePath}/${slug}` : basePath;
      const v = next.view ?? view;
      if (v === 'index') url.searchParams.set('view', 'index');
      else url.searchParams.delete('view');
      if (next.photo) url.searchParams.set('photo', next.photo);
      else if (next.photo === null) url.searchParams.delete('photo');
      window.history.replaceState(null, '', url);
    },
    [album, basePath, view],
  );

  // Scroll-linked roll: page scroll inside the tall section moves the strip.
  useEffect(() => {
    if (view !== 'strip' || mode !== 'gl') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = roll.current;
      const gate = stage.current;
      if (!section || !gate) return;
      if (!exposures.length) {
        // An empty roll: hold the blank leader centred in the gate.
        const last = frames[frames.length - 1];
        position.set(last ? (last.start + last.width) / 2 : 0);
        return;
      }
      const { start, end } = rollScrollRange(section, gate);
      const progress = end > start ? Math.min(1, Math.max(0, (window.scrollY - start) / (end - start))) : 0;
      const first = exposures[0].centre;
      const last = exposures[exposures.length - 1].centre;
      const pos = first + progress * (last - first);
      position.set(pos);
      setCurrent(nearestExposure(frames, pos));
      if (window.scrollY > 40) setScrolled(true);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [view, mode, exposures, frames, position]);

  /** Scroll the page so the roll shows a given photograph at the gate. */
  const scrollToFrame = useCallback(
    (index: number, smooth = true) => {
      const section = roll.current;
      const gate = stage.current;
      if (!section || !gate || exposures.length < 2) return;
      const { start, end } = rollScrollRange(section, gate);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: start + (index / (exposures.length - 1)) * (end - start), behavior: smooth && !reduce ? 'smooth' : 'auto' });
    },
    [exposures.length],
  );

  const open = useCallback(
    (index: number, origin: DOMRect | null, from: HTMLElement | null) => {
      opener.current = from;
      setViewer({ index, origin, from: index });
      writeUrl({ photo: filtered[index]?.id ?? null });
    },
    [filtered, writeUrl],
  );

  // Deep link: ?photo=<id> opens that photograph on load.
  useEffect(() => {
    if (!initialPhoto) return;
    const index = filtered.findIndex((photo) => photo.id === initialPhoto);
    if (index >= 0) setViewer({ index, origin: null, from: index });
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const originFor = useCallback(
    (index: number): DOMRect | null => {
      const id = filtered[index]?.id;
      if (view === 'index' || mode === 'dom') {
        const frame = document.querySelector<HTMLElement>(`[data-archive-frames] [data-photo="${id}"] .mx-film-window`);
        if (!frame) return null;
        frame.scrollIntoView({ block: 'nearest', inline: 'center' });
        return frame.getBoundingClientRect();
      }
      // On the roll: return to the same frame if unchanged, otherwise move the
      // roll to the photograph last viewed and fade back.
      if (index === viewer.from && viewer.origin) return viewer.origin;
      scrollToFrame(index, false);
      return null;
    },
    [filtered, view, mode, viewer.from, viewer.origin, scrollToFrame],
  );

  const choose = (slug: string | null) => {
    setAlbum(slug);
    setMenuOpen(false);
    setCurrent(0);
    writeUrl({ album: slug });
    if (view === 'strip') window.scrollTo({ top: 0 });
    menuButton.current?.focus();
  };

  const switchView = (next: View) => {
    setView(next);
    writeUrl({ view: next });
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const photo = filtered[current] ?? null;
  const caption = photo ? (photo.caption || photo.alt).toUpperCase() : '';
  const counter = exposures.length ? `${frameNumber(current)} / ${String(exposures.length).padStart(2, '0')}` : '00 / 00';
  const scrambled = useScramble(caption);
  const meta = photo ? [photo.albumTitle, photo.date ? formatDate(new Date(photo.date), locale) : null].filter(Boolean).join(' · ') : '';
  const frameLabel = (index: number, item: ArchivePhoto) =>
    `${labels.open} ${index + 1} ${labels.of} ${filtered.length}: ${item.caption || item.alt}`;

  const hud = (
    <>
      <div className="mx-film-hud-top">
        <div className="mx-film-modes" role="group" aria-label={labels.views}>
          <span className="mx-film-mark">{labels.archive}</span>
          {(['strip', 'index'] as const).map((key) => (
            <button key={key} type="button" aria-pressed={view === key} onClick={() => switchView(key)} className="mx-film-mode">
              <span aria-hidden="true" className="mx-film-caret">
                ▸
              </span>
              {key === 'strip' ? labels.strip : labels.index}
            </button>
          ))}
        </div>
        {albums.length >= 2 ? (
          <div className="relative">
            <button ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="film-albums" onClick={() => setMenuOpen((value) => !value)} className="mx-film-menu-btn">
              <span className="sr-only">{labels.albums}</span>
              <span aria-hidden="true" className="mx-film-menu-icon" data-open={menuOpen} />
            </button>
            {menuOpen ? (
              <nav id="film-albums" aria-label={labels.albums} className="mx-film-menu">
                <ul>
                  {[{ slug: null as string | null, title: labels.all, count: photos.length }, ...albums].map((entry) => (
                    <li key={entry.slug ?? 'all'}>
                      <button type="button" aria-pressed={album === entry.slug} onClick={() => choose(entry.slug)}>
                        <span aria-hidden="true" className="mx-film-caret">
                          ▸
                        </span>
                        {entry.title}
                        <span className="mx-film-menu-count">{String(entry.count).padStart(2, '0')}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  const viewerNode = (
    <PhotoProject
      photos={filtered}
      index={viewer.index}
      origin={viewer.origin}
      onIndex={(index) => {
        setViewer((state) => ({ ...state, index }));
        writeUrl({ photo: index === null ? null : filtered[index]?.id ?? null });
      }}
      originFor={originFor}
      returnFocus={() => opener.current}
      labels={labels}
      locale={locale}
    />
  );

  // ---------------------------------------------------------------- Index
  if (view === 'index') {
    return (
      <section aria-labelledby="film-title" className="mx-film mx-film-light">
        <div className="mx-film-index-head">
          <h1 id="film-title" className="sr-only">
            {labels.title}
          </h1>
          {hud}
        </div>
        {filtered.length ? (
          <ul data-archive-frames className="mx-film-table" aria-label={labels.frames}>
            {filtered.map((item, index) => (
              <li key={item.id} className="mx-film-table-cell" style={{ ['--aspect' as string]: Math.min(1.9, Math.max(0.62, (item.width ?? 3) / (item.height ?? 2))) }}>
                <FilmFrame
                  photo={item}
                  index={index}
                  edge={labels.edge}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 34vw, 50vw"
                  label={frameLabel(index, item)}
                  unavailable={labels.unavailable}
                  priority={index < 6}
                  onOpen={(button) => open(index, button.querySelector('.mx-film-window')?.getBoundingClientRect() ?? null, button)}
                />
              </li>
            ))}
            <li aria-hidden="true" className="mx-film-table-spacer" />
          </ul>
        ) : (
          <EmptyRoll labels={labels} />
        )}
        {viewerNode}
      </section>
    );
  }

  // ---------------------------------------------------------- Film strip
  const glMode = mode === 'gl';
  return (
    <section
      ref={roll}
      aria-labelledby="film-title"
      className="mx-film mx-film-light mx-film-roll"
      style={glMode && travel > 0 ? { ['--travel' as string]: `${travel * perFrame}svh` } : undefined}
      data-mode={mode}
    >
      <div ref={stage} className={cn('mx-film-stage', glMode && glReady && 'is-revealed')} data-hovering={hover ? 'true' : undefined} onPointerLeave={() => setHover(null)}>
        <h1 id="film-title" className="sr-only">
          {labels.title}
        </h1>
        {hud}

        {glMode ? (
          <div className="mx-film-gl">
            <GLBoundary onError={() => setMode('dom')}>
              <FilmStripGL
                frames={frames}
                photos={glPhotos}
                position={position}
                edge={labels.edge}
                active={viewer.index === null}
                onReady={() => setGlReady(true)}
                onHover={(index, point) => setHover(index === null || !point ? null : { photo: index, x: point.x, y: point.y })}
                onOpen={(index, rect) => open(index, rect, document.querySelector<HTMLElement>(`[data-roll-frame="${index}"]`))}
              />
            </GLBoundary>
          </div>
        ) : mode === 'dom' ? (
          <ul
            data-archive-frames
            className="mx-film-dom-strip"
            aria-label={labels.frames}
            onScroll={(event) => {
              // Caption follows the frame nearest the centre of the native scroller.
              const list = event.currentTarget;
              const middle = list.scrollLeft + list.clientWidth / 2;
              let best = 0;
              let distance = Infinity;
              Array.from(list.children).forEach((child, i) => {
                const el = child as HTMLElement;
                const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
                if (d < distance) {
                  distance = d;
                  best = i;
                }
              });
              setCurrent(best);
            }}
          >
            {filtered.map((item, index) => (
              <li key={item.id} style={{ ['--aspect' as string]: Math.min(1.9, Math.max(0.62, (item.width ?? 3) / (item.height ?? 2))) }}>
                <FilmFrame
                  photo={item}
                  index={index}
                  edge={labels.edge}
                  sizes="60vw"
                  label={frameLabel(index, item)}
                  unavailable={labels.unavailable}
                  priority={index < 2}
                  onOpen={(button) => open(index, button.querySelector('.mx-film-window')?.getBoundingClientRect() ?? null, button)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {!filtered.length ? <EmptyRoll labels={labels} overlay /> : null}

        {filtered.length ? (
          <>
            <p className="mx-film-hud-caption" aria-live="polite">
              <span>{counter}</span>
              <span aria-hidden="true"> · {scrambled}</span>
              <span className="sr-only"> · {caption}</span>
            </p>
            {meta ? <p className="mx-film-hud-meta">{meta}</p> : null}
            {glMode && travel > 0 ? <p className={cn('mx-film-hint', scrolled && 'is-hidden')}>{labels.hint}</p> : null}
          </>
        ) : null}

        {hover ? (
          <span aria-hidden="true" className="mx-film-cursor" style={{ transform: `translate(${hover.x}px, ${hover.y}px)` }}>
            <span>{frameNumber(hover.photo)}</span>
          </span>
        ) : null}

        {/* Keyboard and screen-reader access to the roll */}
        {glMode ? (
          <ol className="sr-only" aria-label={labels.frames}>
            {filtered.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-roll-frame={index}
                  onFocus={() => scrollToFrame(index, false)}
                  onClick={(event) => open(index, null, event.currentTarget)}
                >
                  {frameLabel(index, item)}
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {activeAlbum ? <span className="sr-only">{activeAlbum.title}</span> : null}
      {viewerNode}
    </section>
  );
}

function EmptyRoll({ labels, overlay }: { labels: FilmLabels; overlay?: boolean }) {
  return (
    <div className={cn('mx-film-empty', overlay && 'is-overlay')}>
      <p className="mx-film-empty-title">{labels.empty}</p>
      <p className="mx-film-empty-note">{labels.emptyNote}</p>
    </div>
  );
}
