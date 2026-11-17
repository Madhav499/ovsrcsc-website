import { describe, expect, it } from 'vitest';
import { repairText } from './text';

describe('repairText', () => {
  it('repairs UTF-8 punctuation mis-decoded as Windows-1252', () => {
    expect(repairText('hands-on â€” for school students')).toBe('hands-on — for school students');
    expect(repairText('National Childrenâ€™s Science Congress')).toBe('National Children’s Science Congress');
    expect(repairText('â€œquotedâ€\u009d')).toBe('“quoted”');
  });

  it('leaves correct text untouched', () => {
    for (const text of ['Café — naïve façade', 'લોક વિજ્ઞાન કેન્દ્ર', 'विज्ञान सबके लिए', 'Â', '']) {
      expect(repairText(text)).toBe(text);
    }
    expect(repairText(null)).toBe(null);
  });
});
