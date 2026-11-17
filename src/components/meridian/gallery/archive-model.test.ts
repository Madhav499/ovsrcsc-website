import { describe, expect, it } from 'vitest';
import { distribute, heightRatio, padCount } from './archive-model';

const photo = (width: number, height: number) => ({ width, height });

describe('distribute', () => {
  it('places every photo exactly once', () => {
    const photos = Array.from({ length: 21 }, (_, i) => photo(1000, 600 + (i % 5) * 150));
    for (const columns of [2, 3, 4]) {
      const placed = distribute(photos, columns).flat().map((entry) => entry.index).sort((a, b) => a - b);
      expect(placed).toEqual(photos.map((_, i) => i));
    }
  });

  it('fills the shortest column first, keeping columns balanced', () => {
    const cols = distribute([photo(100, 300), photo(100, 100), photo(100, 100), photo(100, 100)], 2);
    expect(cols[0].map((e) => e.index)).toEqual([0]);
    expect(cols[1].map((e) => e.index)).toEqual([1, 2, 3]);
  });

  it('starts left-to-right for equal heights', () => {
    const cols = distribute([photo(1, 1), photo(1, 1), photo(1, 1)], 3);
    expect(cols.map((c) => c[0].index)).toEqual([0, 1, 2]);
  });
});

describe('helpers', () => {
  it('falls back to 4:3 for unknown dimensions', () => {
    expect(heightRatio({ width: null, height: null })).toBeCloseTo(0.75);
  });
  it('pads counts like the reference', () => {
    expect(padCount(8)).toBe('08');
    expect(padCount(188)).toBe('188');
  });
});
