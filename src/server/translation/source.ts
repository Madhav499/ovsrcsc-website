/**
 * English is the only editable source. Gujarati and Hindi rows are written by
 * the translation service alone, so whatever an editor (or a crafted request)
 * submits for other locales is ignored here, on the server.
 */
export function englishSource<T extends { locale?: string | null }>(translations: T[]): T[] {
  return translations.filter((translation) => (translation.locale ?? 'en').toLowerCase() === 'en');
}
