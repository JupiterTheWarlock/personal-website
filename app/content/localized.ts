import { games, explorations, notes, type ContentCardData } from './home';
import { fallbackLocale } from '../i18n/config';
import { getMessages, type CardText } from '../i18n/messages';

export function localizeCards(
  cards: ContentCardData[],
  translated: Record<string, Partial<CardText>>,
  fallback: Record<string, Partial<CardText>>,
): ContentCardData[] {
  return cards.map((card) => ({
    ...card,
    title: translated[card.id]?.title?.trim() || fallback[card.id]?.title?.trim() || card.title,
    description: translated[card.id]?.description?.trim() || fallback[card.id]?.description?.trim() || card.description,
  }));
}

export function getHomeContent(locale: string) {
  const translated = getMessages(locale).content;
  const fallback = getMessages(fallbackLocale).content;
  return {
    games: localizeCards(games, translated, fallback),
    explorations: localizeCards(explorations, translated, fallback),
    notes: localizeCards(notes, translated, fallback),
  };
}
