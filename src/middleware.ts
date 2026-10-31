import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type LocaleCode } from '@/lib/constants';
import { LEGACY_REDIRECTS } from '@/lib/legacy-redirects';

const PUBLIC_FILE = /\.(?:ico|png|jpe?g|gif|webp|svg|css|js|map|txt|xml|pdf|webmanifest)$/i;

function isLocale(value: string): value is LocaleCode {
  return (LOCALES as readonly string[]).includes(value);
}

function preferredLocale(request: NextRequest): LocaleCode {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const ordered = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), quality: Number(quality ?? '1') || 0 };
    })
    .sort((a, b) => b.quality - a.quality);
  for (const entry of ordered) {
    if (entry.tag.startsWith('gu')) return 'gu';
    if (entry.tag.startsWith('hi')) return 'hi';
    if (entry.tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

function withLocale(destination: string, locale: LocaleCode): string {
  if (destination === '/en') return `/${locale}`;
  if (destination.startsWith('/en/')) return `/${locale}/${destination.slice(4)}`;
  return destination;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/media') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isLocale(firstSegment)) {
    const rest = segments.length > 1 ? `/${segments.slice(1).join('/')}` : '/';
    const legacy = LEGACY_REDIRECTS[rest];
    const destination = legacy ? withLocale(legacy, firstSegment) : null;
    if (legacy && destination && destination !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      url.search = search;
      return NextResponse.redirect(url, 308);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-ovsrcsc-path', pathname);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  }

  const locale = preferredLocale(request);
  const legacy = LEGACY_REDIRECTS[pathname];
  const url = request.nextUrl.clone();
  url.pathname = legacy
    ? withLocale(legacy, locale)
    : pathname === '/'
      ? `/${locale}`
      : `/${locale}${pathname}`;
  url.search = search;
  const response = NextResponse.redirect(url, 308);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|media|admin).*)'],
};
