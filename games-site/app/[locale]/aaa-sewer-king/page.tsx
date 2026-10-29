import { notFound } from 'next/navigation';
import { isLocale } from '../../../../app/i18n/config';
import GameIntroduction from '../../../../components/content/GameIntroduction';
import { gamesMetadata, gamesPath } from '../../../site';

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return gamesMetadata(params.locale, true);
}

export default function GamePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return <GameIntroduction locale={params.locale} backHref={gamesPath('/', params.locale)} />;
}
