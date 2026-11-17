/*
 * Preparing English text for machine translation, and restoring the result.
 * Pure functions (no server imports) so they can be unit-tested directly.
 *
 * Never translated: URLs, email addresses, phone numbers, inline code and
 * {placeholders}. They are wrapped in <span translate="no">, which Google
 * Cloud Translation leaves verbatim in HTML mode, and unwrapped afterwards.
 */

const PROTECTED = new RegExp(
  [
    String.raw`https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]`, // URLs
    String.raw`\bwww\.[^\s<>"']+[^\s<>"'.,;:!?)]`,
    String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`, // emails
    String.raw`\+?\d[\d\s()-]{7,}\d`, // phone numbers
    String.raw`\{[A-Za-z0-9_.]+\}`, // {placeholders}
    String.raw`` + '`[^`]+`', // `code`
  ].join('|'),
  'g',
);

const OPEN = '<span translate="no" class="notranslate">';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function wrapTokens(text: string): string {
  return text.replace(PROTECTED, (match) => `${OPEN}${match}</span>`);
}

/** English field → HTML segment for the provider. Tags and attributes are never altered. */
export function prepareSegment(value: string, kind: 'text' | 'html'): string {
  if (kind === 'text') return wrapTokens(escapeHtml(value));
  // Only text between tags is wrapped; tags (and their href/src values) pass through.
  return value
    .split(/(<[^>]*>)/g)
    .map((part) => (part.startsWith('<') ? part : wrapTokens(part)))
    .join('');
}

/** Provider output → stored value. */
export function restoreSegment(value: string, kind: 'text' | 'html'): string {
  const unwrapped = value.replace(/<span translate="no" class="notranslate">([\s\S]*?)<\/span>/g, '$1');
  return kind === 'text' ? unescapeHtml(unwrapped).trim() : unwrapped.trim();
}
