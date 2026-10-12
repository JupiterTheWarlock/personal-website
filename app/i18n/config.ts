export const locales = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'] as const;
export const defaultLocale = 'zh-CN' as const;
export const fallbackLocale = 'en-US' as const;
export const localeCookie = 'NEXT_LOCALE';

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.some((locale) => locale === value);
}
