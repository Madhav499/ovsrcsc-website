import sanitizeHtml from 'sanitize-html';
import { isSafeLinkHref } from './utils';

const allowedTags = [
  'p',
  'div',
  'span',
  'br',
  'hr',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'sup',
  'sub',
];

export interface SanitizeOptions {
  allowImages?: boolean;
  allowTables?: boolean;
}

export function sanitizeRichHtml(input: string, options: SanitizeOptions = {}): string {
  const { allowImages = true, allowTables = true } = options;
  const tags = allowedTags.filter((tag) => {
    if (!allowImages && (tag === 'img' || tag === 'figure')) return false;
    if (!allowTables && ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption'].includes(tag)) {
      return false;
    }
    return true;
  });

  return sanitizeHtml(input, {
    allowedTags: tags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      '*': [],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
      a: ['http', 'https', 'mailto', 'tel'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        if (!isSafeLinkHref(href)) {
          return { tagName: 'span', attribs: {}, text: attribs.title ?? '' };
        }
        const external = /^https?:\/\//i.test(href);
        return {
          tagName: 'a',
          attribs: {
            href,
            ...(attribs.title ? { title: attribs.title } : {}),
            ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
        };
      },
      img: (tagName, attribs) => {
        const src = attribs.src ?? '';
        const safeSrc = src.startsWith('/media/') || /^https:\/\//i.test(src);
        if (!safeSrc) {
          return { tagName: 'span', attribs: {}, text: '' };
        }
        return {
          tagName: 'img',
          attribs: {
            src,
            alt: attribs.alt ?? '',
            loading: 'lazy',
            ...(attribs.title ? { title: attribs.title } : {}),
            ...(attribs.width ? { width: attribs.width } : {}),
            ...(attribs.height ? { height: attribs.height } : {}),
          },
        };
      },
    },
    exclusiveFilter: (frame) => {
      if (['p', 'div', 'span', 'li'].includes(frame.tag)) {
        const text = (frame.text ?? '').replace(/\u00a0/g, ' ').trim();
        const hasMedia = Array.isArray(frame.mediaChildren) && frame.mediaChildren.length > 0;
        return text.length === 0 && !hasMedia;
      }
      return false;
    },
  });
}

export function plainTextFromHtml(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerptFromHtml(input: string, maxLength = 180): string {
  const text = plainTextFromHtml(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function countWords(input: string): number {
  const text = plainTextFromHtml(input);
  return text ? text.split(/\s+/).length : 0;
}
