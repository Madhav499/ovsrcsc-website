import { Manrope, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Sora } from 'next/font/google';

export const fontDisplay = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const fontBody = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const fontGujarati = Noto_Sans_Gujarati({
  subsets: ['gujarati'],
  variable: '--font-gujarati',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const fontVariables = [
  fontDisplay.variable,
  fontBody.variable,
  fontGujarati.variable,
  fontDevanagari.variable,
].join(' ');
