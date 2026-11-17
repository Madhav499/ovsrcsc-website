'use client';

import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/';

/**
 * Decodes text in letter by letter, the way the reference's captions change.
 * Only Latin text is scrambled (random Latin glyphs inside Gujarati or
 * Devanagari words would read as corruption); other scripts and reduced
 * motion simply swap. Screen readers get the final text via the caller.
 */
export function useScramble(text: string, durationMs = 520): string {
  const [shown, setShown] = useState(text);
  const frame = useRef(0);

  useEffect(() => {
    const latin = /^[\x20-\x7E·–—’]*$/.test(text);
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!latin || reduce) {
      setShown(text);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const settled = Math.floor(p * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i += 1) {
        out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setShown(out);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, durationMs]);

  return shown;
}
