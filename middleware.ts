import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, localeCookie } from './app/i18n/config';
import { detectLocale, matchLanguage } from './app/i18n/routing';

export function middleware(request: NextRequest) {
  const originalPath = request.nextUrl.pathname;
  const pathname = originalPath.replace(/^\/personal-website(?=\/|$)/, '') || '/';
  const firstSegment = pathname.split('/')[1];
  const canonicalLocale = matchLanguage(firstSegment);
  const target = request.nextUrl.clone();

  if (isLocale(firstSegment)) {
    if (pathname === originalPath) return NextResponse.next();
    target.pathname = pathname;
  } else if (canonicalLocale) {
    target.pathname = pathname.replace(`/${firstSegment}`, `/${canonicalLocale}`);
  } else if (pathname === '/' || pathname === '/animations' || pathname === '/animations/') {
    const locale = detectLocale({
      saved: request.cookies.get(localeCookie)?.value,
      country: request.headers.get('x-vercel-ip-country'),
      acceptLanguage: request.headers.get('accept-language'),
    });
    target.pathname = `/${locale}${pathname === '/' ? '/' : pathname}`;
  } else {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(target, 307);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie, Accept-Language, X-Vercel-IP-Country');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|junkyard-scene|.*\\..*).*)'],
};
