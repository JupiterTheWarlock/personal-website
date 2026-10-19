import type { Metadata } from 'next';
import { locales, type Locale } from '../app/i18n/config';
import { getMessages } from '../app/i18n/messages';

export const gamesOrigin = 'https://games.jupiterthewarlock.com';
export const gameSlug = 'aaa-sewer-king';
export const runtimePath = `/${gameSlug}/play/`;
export const gamesPath = (path: string, locale: Locale) => `${path}?lang=${locale}`;

export function gamesMetadata(locale: Locale, game = false): Metadata {
  const copy = getMessages(locale);
  const path = game ? `/${gameSlug}/` : '/';
  return {
    title: game ? copy.sewerKing.title : copy.nav.games,
    description: game ? copy.sewerKing.description : copy.sewerKing.tagline,
    // Absolute strings with no base preserve the language query on the root URL in Next 14.
    metadataBase: null,
    alternates: {
      canonical: `${gamesOrigin}${gamesPath(path, locale)}`,
      languages: { ...Object.fromEntries(locales.map(value => [value, `${gamesOrigin}${gamesPath(path, value)}`])), 'x-default': `${gamesOrigin}${path}` },
    },
    icons: { icon: '/images/games/aaa-sewer-king-icon.png' },
  };
}
