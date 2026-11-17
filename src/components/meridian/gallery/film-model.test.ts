import { describe, expect, it } from 'vitest';
import { exposed, FRAME_GAP, frameAspect, frameNumber, layoutStrip, LEADER_FRAMES, nearestExposure, tableTilt } from './film-model';

const p = (width: number | null, height: number | null) => ({ width, height });

describe('frameAspect', () => {
  it('keeps real proportions and clamps extremes', () => {
    expect(frameAspect(p(1280, 720))).toBeCloseTo(1.778);
    expect(frameAspect(p(963, 1280))).toBeCloseTo(0.752);
    expect(frameAspect(p(4000, 500))).toBe(1.9);
    expect(frameAspect(p(100, 1000))).toBe(0.62);
    expect(frameAspect(p(null, null))).toBe(1.5);
  });
});

describe('layoutStrip', () => {
  it('handles zero photos as blank film only', () => {
    const frames = layoutStrip([]);
    expect(frames).toHaveLength(LEADER_FRAMES * 2);
    expect(exposed(frames)).toHaveLength(0);
  });

  it('places one, two and many photos inside leader film, in order, without gaps', () => {
    for (const count of [1, 2, 10, 300]) {
      const photos = Array.from({ length: count }, (_, i) => p(1000 + (i % 7) * 100, 800));
      const frames = layoutStrip(photos);
      expect(exposed(frames).map((f) => f.photo)).toEqual(photos.map((_, i) => i));
      for (let i = 1; i < frames.length; i += 1) {
        expect(frames[i].start).toBeCloseTo(frames[i - 1].start + frames[i - 1].width + FRAME_GAP);
      }
    }
  });

  it('deleting a photo shifts later frames up without disturbing earlier ones', () => {
    const photos = [p(1600, 900), p(900, 1200), p(1200, 1200), p(1600, 900)];
    const before = exposed(layoutStrip(photos));
    const after = exposed(layoutStrip([photos[0], photos[2], photos[3]]));
    expect(after[0].start).toBeCloseTo(before[0].start);
    expect(after[1].width).toBeCloseTo(before[2].width);
    expect(after).toHaveLength(3);
  });
});

describe('nearestExposure', () => {
  it('finds the photo nearest a strip position and ignores leader film', () => {
    const frames = layoutStrip([p(1, 1), p(1, 1), p(1, 1)]);
    const second = exposed(frames)[1];
    expect(nearestExposure(frames, second.centre + 0.1)).toBe(1);
    expect(nearestExposure(frames, -100)).toBe(0);
    expect(nearestExposure(layoutStrip([]), 0)).toBe(-1);
  });
});

describe('labels', () => {
  it('numbers frames like film edge print', () => {
    expect(frameNumber(0)).toBe('01');
    expect(frameNumber(26, true)).toBe('27A');
  });
  it('gives each photo a stable, small light-table tilt', () => {
    expect(tableTilt('abc')).toBe(tableTilt('abc'));
    for (const id of ['a', 'cmwky7v56', 'xyz-123']) expect(Math.abs(tableTilt(id))).toBeLessThanOrEqual(0.8);
  });
});
