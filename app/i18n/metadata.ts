import type { Metadata } from 'next';
import { locales, type Locale } from './config';
import { getMessages } from './messages';

export const siteUrl = 'https://www.jthewl.cc';

export function languageAlternates(path = '') {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}/${path}`])),
    'x-default': `${siteUrl}/${path}`,
  };
}

export function localizedMetadata(locale: Locale, path = ''): Metadata {
  const messages = getMessages(locale);
  return {
    title: path ? `${messages.animations.title} — ${messages.hero.title}` : messages.meta.title,
    description: messages.meta.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}/${locale}/${path}`,
      languages: languageAlternates(path),
    },
    icons: { icon: 'https://cfr2cdn.jthewl.cc/头像.jpg' },
  };
}
