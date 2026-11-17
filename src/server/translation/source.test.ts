import { describe, expect, it } from 'vitest';
import { englishSource } from './source';

describe('englishSource', () => {
  it('keeps only the English entry, whatever the editor submitted', () => {
    const submitted = [
      { locale: 'en', title: 'Star party' },
      { locale: 'gu', title: 'હાથથી બદલાયેલું' },
      { locale: 'hi', title: 'हाथ से बदला' },
    ];
    expect(englishSource(submitted)).toEqual([{ locale: 'en', title: 'Star party' }]);
  });

  it('treats a missing locale as English and ignores case', () => {
    expect(englishSource([{ title: 'A' }, { locale: 'EN', title: 'B' }, { locale: null, title: 'C' }])).toHaveLength(3);
  });

  it('returns nothing for a crafted request with only gu/hi (the save is then refused)', () => {
    expect(englishSource([{ locale: 'gu', title: 'x' }, { locale: 'hi', title: 'y' }])).toEqual([]);
  });
});
