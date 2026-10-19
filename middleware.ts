import { NextResponse, type NextRequest } from 'next/server';
import { languageRedirect } from './app/i18n/request-routing';

export function middleware(request: NextRequest) {
  // Used by next dev and the old Vercel fallback only. Pages uses functions/_middleware.ts.
  return languageRedirect(request,
    request.headers.get('cf-ipcountry') ?? request.headers.get('x-vercel-ip-country'))
    ?? NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|junkyard-scene|.*\\..*).*)'],
};
