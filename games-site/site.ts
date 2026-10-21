import type { Metadata } from 'next';
import { locales, type Locale } from '../app/i18n/config';
import { getMessages } from '../app/i18n/messages';
import { sewerKingArtwork } from '../app/content/sewer-king';

export const gamesOrigin = 'https://games.jupiterthewarlock.com';
export const gameSlug = 'aaa-sewer-king';
export const runtimePath = `/${gameSlug}/play/`;
export const gamesPath = (path: string, locale: Locale) => `${path}?lang=${locale}`;

export function gamesMetadata(locale: Locale, game = false): Metadata {
  const copy = getMessages(locale);
  const path = game ? `/${gameSlug}/` : '/';
  const title = game ? copy.sewerKing.title : copy.nav.games;
  const description = game ? copy.sewerKing.description : copy.sewerKing.tagline;
  const url = `${gamesOrigin}${gamesPath(path, locale)}`;
  const image = { url: `${gamesOrigin}${sewerKingArtwork(locale)}`, alt: copy.sewerKing.artworkAlt };
  return {
    title,
    description,
    openGraph: {
      type: 'website', title, description, url,
      locale: locale.replace('-', '_'), images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    // Absolute strings with no base preserve the language query on the root URL in Next 14.
    metadataBase: null,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(locales.map(value => [value, `${gamesOrigin}${gamesPath(path, value)}`])), 'x-default': `${gamesOrigin}${path}` },
    },
    icons: { icon: '/images/games/aaa-sewer-king-icon.png' },
  };
}
