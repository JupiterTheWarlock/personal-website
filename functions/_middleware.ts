import { languageRedirect } from '../app/i18n/request-routing';

type PagesContext = {
  request: Request & { cf?: { country?: string } };
  next: () => Promise<Response>;
};

export function onRequest({ request, next }: PagesContext) {
  const url = new URL(request.url);
  if (url.pathname === '/art-inspiration' || url.pathname.startsWith('/art-inspiration/')) {
    const target = new URL('https://artstyles.jupiterthewarlock.com');
    target.pathname = url.pathname.slice('/art-inspiration'.length) || '/';
    target.search = url.search;
    return Response.redirect(target.toString(), 301);
  }
  const country = request.cf?.country ?? request.headers.get('cf-ipcountry');
  return languageRedirect(request, country) ?? next();
}
