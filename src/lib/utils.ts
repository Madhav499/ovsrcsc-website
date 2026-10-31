export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function sanitizePagePath(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment
        .normalize('NFKD')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('/');
}

export function isValidPagePath(path: string): boolean {
  if (!path || path.length > 180) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(path);
}

export function truncate(value: string, max = 160): string {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function absoluteUrl(path: string, base?: string): string {
  const origin = (base ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function parsePositiveInt(value: unknown, fallback: number): number {
  const number = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeLinkHref(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (value.startsWith('#')) return true;
  if (value.startsWith('mailto:') || value.startsWith('tel:')) return true;
  return isSafeHttpUrl(value);
}
