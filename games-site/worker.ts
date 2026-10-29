import { detectLocale } from '../app/i18n/routing';
import { isLocale, localeCookie } from '../app/i18n/config';

type Assets = { fetch: (request: Request) => Promise<Response> };

export default {
  async fetch(request: Request & { cf?: { country?: string } }, env: { ASSETS: Assets }) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/aaa-sewer-king/play' || path.startsWith('/aaa-sewer-king/play/')) {
      return Response.redirect('https://www.taptap.cn/app/978232', 301);
    }
    const redirect = (pathname: string) => { url.pathname = pathname; return Response.redirect(url.href, 308); };
    if (path === '/aaa-sewer-king') return redirect('/aaa-sewer-king/');
    if (path === '/' || path === '/aaa-sewer-king/') {
      let saved;
      try { saved = decodeURIComponent(request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${localeCookie}=`))?.slice(localeCookie.length + 1) || ''); } catch { /* Ignore malformed cookies. */ }
      const explicit = url.searchParams.get('lang');
      const locale = isLocale(explicit) ? explicit : detectLocale({ saved, country: request.cf?.country, acceptLanguage: request.headers.get('accept-language') });
      const internal = new URL(url);
      internal.pathname = `/${locale}${path}`;
      internal.search = '';
      const asset = await env.ASSETS.fetch(new Request(internal, request));
      const response = new Response(asset.body, asset);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('Vary', 'Cookie, Accept-Language');
      response.headers.set('Content-Language', locale);
      return response;
    }
    if (/^\/(?:_next|images)\//.test(path) || ['/sitemap.xml', '/robots.txt', '/favicon.ico'].includes(path)) return env.ASSETS.fetch(request);
    const asset = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
    return new Response(asset.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  },
};
