import { languageRedirect } from '../app/i18n/request-routing';

type PagesContext = {
  request: Request & { cf?: { country?: string } };
  next: () => Promise<Response>;
};

export function onRequest({ request, next }: PagesContext) {
  const country = request.cf?.country ?? request.headers.get('cf-ipcountry');
  return languageRedirect(request, country) ?? next();
}
