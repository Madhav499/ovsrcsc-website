import {
  Manrope,
  Newsreader,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Sora,
} from 'next/font/google';

/*
 * Public-site typography for the MERIDIAN design system.
 * Applied only by the public layout — the admin keeps using `src/lib/fonts.ts`.
 *
 * Sora      — expressive display headings
 * Manrope   — readable body and interface text
 * Newsreader — editorial serif accents (Latin only; Gujarati/Hindi fall back to Noto)
 * Noto Sans Gujarati / Devanagari — script coverage for gu and hi
 */

const display = Sora({
  subsets: ['latin'],
  variable: '--mx-font-display-latin',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--mx-font-body-latin',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--mx-font-serif-latin',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500'],
});

const gujarati = Noto_Sans_Gujarati({
  subsets: ['gujarati'],
  variable: '--mx-font-gujarati',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--mx-font-devanagari',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const meridianFontVariables = [
  display.variable,
  body.variable,
  serif.variable,
  gujarati.variable,
  devanagari.variable,
].join(' ');
