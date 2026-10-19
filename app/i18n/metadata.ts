import type { Metadata } from 'next';
import { locales, type Locale } from './config';
import { getMessages } from './messages';

export const siteUrl = 'https://jupiterthewarlock.com';

export function languageAlternates(path = '') {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}/${path}`])),
    'x-default': `${siteUrl}/${path}`,
  };
}

export function localizedMetadata(locale: Locale, path = '', page?: { title: string; description: string }): Metadata {
  const messages = getMessages(locale);
  return {
    title: page ? `${page.title} — ${messages.hero.title}` : path ? `${messages.animations.title} — ${messages.hero.title}` : messages.meta.title,
    description: page?.description || messages.meta.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}/${locale}/${path}`,
      languages: languageAlternates(path),
    },
    icons: { icon: 'https://cfr2cdn.jthewl.cc/头像.jpg' },
  };
}
