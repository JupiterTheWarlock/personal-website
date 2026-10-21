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
  const title = page ? `${page.title} — ${messages.hero.title}` : path ? `${messages.animations.title} — ${messages.hero.title}` : messages.meta.title;
  const description = page?.description || messages.meta.description;
  const url = `${siteUrl}/${locale}/${path}`;
  const image = { url: `${siteUrl}/images/social/home-card-en.png`, width: 1200, height: 630, alt: messages.meta.title };
  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: 'website', title, description, url,
      siteName: messages.hero.title,
      locale: locale.replace('-', '_'),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image', title, description,
      creator: '@JupiterTheWL', images: [image],
    },
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    icons: { icon: 'https://cfr2cdn.jthewl.cc/头像.jpg' },
  };
}
