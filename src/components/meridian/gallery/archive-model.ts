/** One photograph in the archive (serialisable; built on the server from CMS albums). */
export interface ArchivePhoto {
  /** Media id — stable across albums, used to de-duplicate "All". */
  id: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  /** Album slugs this photograph belongs to. */
  albums: string[];
}

/** An album is the CMS's own grouping, used here as a browsing category. */
export interface ArchiveAlbum {
  slug: string;
  title: string;
  count: number;
}

/** Height-to-width ratio; unknown dimensions are treated as 4:3. */
export function heightRatio(photo: Pick<ArchivePhoto, 'width' | 'height'>): number {
  return photo.width && photo.height ? photo.height / photo.width : 3 / 4;
}

/**
 * Masonry by shortest column: each photo goes to the column that is
 * currently shortest, using known aspect ratios. Deterministic (same on
 * server and client), keeps reading order roughly left-to-right, and needs
 * no layout measurement — so nothing shifts while images load.
 */
export function distribute<T extends Pick<ArchivePhoto, 'width' | 'height'>>(photos: T[], columns: number) {
  const cols: Array<Array<{ photo: T; index: number }>> = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  photos.forEach((photo, index) => {
    let target = 0;
    for (let c = 1; c < columns; c += 1) if (heights[c] < heights[target] - 1e-6) target = c;
    cols[target].push({ photo, index });
    heights[target] += heightRatio(photo);
  });
  return cols;
}

/** Zero-padded count in the reference's "(08)" style. */
export function padCount(value: number): string {
  return String(value).padStart(2, '0');
}

/** How many photographs each "Load more" adds. */
export const PAGE_SIZE = 24;
