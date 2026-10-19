import { isLocale, localeCookie } from './config';
import { detectLocale, matchLanguage } from './routing';

function savedLocale(cookie: string | null) {
  const value = cookie?.split(';').map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${localeCookie}=`))?.slice(localeCookie.length + 1);
  try { return value ? decodeURIComponent(value) : undefined; }
  catch { return undefined; }
}

/** Shared by the development server and Pages; static assets never get a locale. */
export function languageRedirect(request: Request, country?: string | null): Response | null {
  const target = new URL(request.url);
  const originalPath = target.pathname;
  const pathname = originalPath.replace(/^\/personal-website(?=\/|$)/, '') || '/';
  const firstSegment = pathname.split('/')[1];
  const canonicalLocale = matchLanguage(firstSegment);
  const isDocument = !pathname.split('/').some((segment) => segment.includes('.'));
  // The Unity document and its assets must keep the same origin and directory in all languages.
  const isGameRuntime = /^\/games\/[^/]+\/play(?:\/|$)/.test(pathname);

  if (isLocale(firstSegment)) {
    if (pathname === originalPath) return null;
    target.pathname = pathname;
  } else if (canonicalLocale && isDocument) {
    target.pathname = pathname.replace(`/${firstSegment}`, `/${canonicalLocale}`);
  } else if (pathname === '/' || /^\/animations\/?$/.test(pathname)
      || (/^\/games\/[^/]+\/?$/.test(pathname) && !isGameRuntime)) {
    const locale = detectLocale({
      saved: savedLocale(request.headers.get('cookie')),
      country,
      acceptLanguage: request.headers.get('accept-language'),
    });
    target.pathname = `/${locale}${pathname === '/' ? '/' : pathname}`;
  } else if (pathname !== originalPath) {
    target.pathname = pathname;
  } else {
    return null;
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie, Accept-Language, CF-IPCountry, X-Vercel-IP-Country',
    },
  });
}
