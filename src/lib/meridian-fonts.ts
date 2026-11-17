import localFont from 'next/font/local';

/*
 * Public-site typography — three voices, self-hosted (no network request at
 * build time). Files live in src/assets/fonts (SIL Open Font License 1.1,
 * from the Fontsource distributions; see src/assets/fonts/LICENSE.md).
 * Applied only by the public layout — the admin keeps using `src/lib/fonts.ts`.
 *
 * Instrument Serif — display headlines (editorial voice)
 * Manrope          — body and interface text (reading voice)
 * IBM Plex Mono    — measurements, diagram labels, captions (instrument voice)
 * Noto Serif Gujarati / Devanagari — display voice for gu and hi
 * Noto Sans Gujarati / Devanagari  — reading voice for gu and hi
 *
 * Script files are the script-only subsets, so Latin pages never load them
 * (they are only requested when a glyph in that range is rendered).
 */

const display = localFont({
  src: [
    { path: '../assets/fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--mx-font-display-latin',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const body = localFont({
  src: '../assets/fonts/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--mx-font-body-latin',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

const mono = localFont({
  src: [
    { path: '../assets/fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--mx-font-mono-latin',
  display: 'swap',
  fallback: ['ui-monospace', 'Cascadia Mono', 'Consolas', 'monospace'],
});

const gujarati = localFont({
  src: '../assets/fonts/noto-sans-gujarati-gujarati-wght-normal.woff2',
  weight: '100 900',
  variable: '--mx-font-gujarati',
  display: 'swap',
  preload: false,
});

const devanagari = localFont({
  src: '../assets/fonts/noto-sans-devanagari-devanagari-wght-normal.woff2',
  weight: '100 900',
  variable: '--mx-font-devanagari',
  display: 'swap',
  preload: false,
});

const gujaratiSerif = localFont({
  src: '../assets/fonts/noto-serif-gujarati-gujarati-wght-normal.woff2',
  weight: '100 900',
  variable: '--mx-font-gujarati-serif',
  display: 'swap',
  preload: false,
});

const devanagariSerif = localFont({
  src: '../assets/fonts/noto-serif-devanagari-devanagari-wght-normal.woff2',
  weight: '100 900',
  variable: '--mx-font-devanagari-serif',
  display: 'swap',
  preload: false,
});

export const meridianFontVariables = [
  display.variable,
  body.variable,
  mono.variable,
  gujarati.variable,
  devanagari.variable,
  gujaratiSerif.variable,
  devanagariSerif.variable,
].join(' ');
