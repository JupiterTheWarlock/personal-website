import { fallbackLocale, isLocale, type Locale } from './config';

const countryLocales: Record<string, Locale> = {
  CN: 'zh-CN', TW: 'zh-TW', HK: 'zh-TW', MO: 'zh-TW',
  JP: 'ja-JP', KR: 'ko-KR', DE: 'de-DE', AT: 'de-DE', LI: 'de-DE',
  FR: 'fr-FR', MC: 'fr-FR', ES: 'es-ES', MX: 'es-ES', AR: 'es-ES',
  BO: 'es-ES', CL: 'es-ES', CO: 'es-ES', CR: 'es-ES', CU: 'es-ES',
  DO: 'es-ES', EC: 'es-ES', GT: 'es-ES', HN: 'es-ES', NI: 'es-ES',
  PA: 'es-ES', PE: 'es-ES', PR: 'es-ES', PY: 'es-ES', SV: 'es-ES',
  UY: 'es-ES', VE: 'es-ES', BR: 'pt-BR', PT: 'pt-BR', AO: 'pt-BR', MZ: 'pt-BR',
  US: 'en-US', GB: 'en-US', AU: 'en-US', NZ: 'en-US', IE: 'en-US',
};

export function matchLanguage(language: string): Locale | undefined {
  const tag = language.trim().replaceAll('_', '-').toLowerCase();
  if (tag === 'zh' || tag.startsWith('zh-')) {
    const parts = tag.split('-');
    if (parts.includes('hant')) return 'zh-TW';
    if (parts.includes('hans')) return 'zh-CN';
    return parts.some((part) => ['tw', 'hk', 'mo'].includes(part)) ? 'zh-TW' : 'zh-CN';
  }
  const languages: Record<string, Locale> = {
    en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', de: 'de-DE',
    fr: 'fr-FR', es: 'es-ES', pt: 'pt-BR',
  };
  return languages[tag.split('-')[0]];
}

export function browserLocale(acceptLanguage: string): Locale | undefined {
  return acceptLanguage.split(',')
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(';');
      const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
      const weight = quality ? Number(quality.trim().slice(2)) : 1;
      return { locale: matchLanguage(tag), weight };
    })
    .filter((entry) => entry.locale && entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight)[0]?.locale;
}

export function detectLocale({ saved, country, acceptLanguage }: {
  saved?: string;
  country?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(saved)) return saved;
  return countryLocales[country?.toUpperCase() ?? '']
    ?? browserLocale(acceptLanguage ?? '')
    ?? fallbackLocale;
}

export function localizedPath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1])) segments[1] = locale;
  else segments.splice(1, 0, locale);
  return segments.join('/');
}
