import localFont from 'next/font/local';

/*
 * Admin typography (used by src/app/(admin)/layout.tsx). Same families and
 * CSS variables as before, now self-hosted from src/assets/fonts (SIL OFL 1.1)
 * so a production build never depends on a Google Fonts request — those
 * requests intermittently failed the whole build.
 */

export const fontDisplay = localFont({
  src: '../assets/fonts/sora-latin-wght-normal.woff2',
  weight: '100 800',
  variable: '--font-display',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const fontBody = localFont({
  src: '../assets/fonts/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const fontGujarati = localFont({
  src: '../assets/fonts/noto-sans-gujarati-gujarati-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-gujarati',
  display: 'swap',
  preload: false,
});

export const fontDevanagari = localFont({
  src: '../assets/fonts/noto-sans-devanagari-devanagari-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-devanagari',
  display: 'swap',
  preload: false,
});

export const fontVariables = [
  fontDisplay.variable,
  fontBody.variable,
  fontGujarati.variable,
  fontDevanagari.variable,
].join(' ');
