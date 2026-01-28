export const locales = ['zh-CN', 'en-US'] as const;
export const defaultLocale = 'zh-CN' as const;

export type Locale = typeof locales[number];

export const localeNames: Record<Locale, string> = {
  'zh-CN': '中文',
  'en-US': 'English'
};

export const localeFlags: Record<Locale, string> = {
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸'
};
