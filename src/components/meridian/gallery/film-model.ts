import { mediaUrl } from '@/lib/media';

/*
 * Film archive model. Everything the strip, index and viewer draw is derived
 * from CMS data at runtime: frame count, order and proportions are never
 * hard-coded, so adding, deleting, reordering or replacing photographs in the
 * admin simply produces a different sequence.
 */

/** One photograph (serialisable; built on the server from published albums). */
export interface ArchivePhoto {
  /** Media id — stable, used to de-duplicate a photo shown in several albums. */
  id: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  /** Album slugs this photograph belongs to (first = where it was found first). */
  albums: string[];
  /** Title of the first album, for the viewer's metadata column. */
  albumTitle: string;
  /** Album event date (ISO) when the CMS has one; never invented. */
  date: string | null;
}

export interface ArchiveAlbum {
  slug: string;
  title: string;
  count: number;
}

/** Frame width ÷ height. Frames keep the photograph's proportions (clamped so a
 *  panorama or a sliver never breaks the strip); unknown sizes read as 3:2. */
export function frameAspect(photo: Pick<ArchivePhoto, 'width' | 'height'>): number {
  if (!photo.width || !photo.height) return 1.5;
  return Math.min(1.9, Math.max(0.62, photo.width / photo.height));
}

export interface StripFrame {
  /** Index into the photo list, or null for blank leader film. */
  photo: number | null;
  /** Left edge along the strip, in frame-height units. */
  start: number;
  width: number;
  /** Centre along the strip. */
  centre: number;
}

/** Blank film kept before the first and after the last exposure. */
export const LEADER_FRAMES = 3;
/** Frame-line gap between exposures, in frame-height units. */
export const FRAME_GAP = 0.12;

/**
 * Lays the photographs out along the strip, with unexposed leader film on
 * both sides so even one or two photos sit inside a continuous roll.
 */
export function layoutStrip(photos: Array<Pick<ArchivePhoto, 'width' | 'height'>>, leader = LEADER_FRAMES): StripFrame[] {
  const frames: StripFrame[] = [];
  let x = 0;
  const push = (photo: number | null, width: number) => {
    frames.push({ photo, start: x, width, centre: x + width / 2 });
    x += width + FRAME_GAP;
  };
  for (let i = 0; i < leader; i += 1) push(null, 1.5);
  photos.forEach((photo, index) => push(index, frameAspect(photo)));
  for (let i = 0; i < leader; i += 1) push(null, 1.5);
  return frames;
}

/** Frames that carry photographs, in order. */
export function exposed(frames: StripFrame[]): StripFrame[] {
  return frames.filter((frame) => frame.photo !== null);
}

/** The exposed frame whose centre is nearest to a position along the strip. */
export function nearestExposure(frames: StripFrame[], position: number): number {
  let best = -1;
  let distance = Infinity;
  for (const frame of frames) {
    if (frame.photo === null) continue;
    const d = Math.abs(frame.centre - position);
    if (d < distance) {
      distance = d;
      best = frame.photo;
    }
  }
  return best;
}

/** Edge-print frame label, e.g. 7 → "07" (and "07A" for the half step). */
export function frameNumber(index: number, half = false): string {
  return `${String(index + 1).padStart(2, '0')}${half ? 'A' : ''}`;
}

/** Deterministic small tilt for a light-table frame (degrees), from its id. */
export function tableTilt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 100) / 100 - 0.5) * 1.6;
}

/** Next.js image-optimiser URL for a stored photo at a given width. The roll's
 *  WebGL textures and the viewer's opening move share it, so the frame that
 *  flies forward is already in the browser cache. */
export function thumbUrl(storageKey: string, width = 1080): string {
  const src = mediaUrl(storageKey);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
