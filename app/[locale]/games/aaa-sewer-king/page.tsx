import { notFound } from 'next/navigation';
import { isLocale } from '@/app/i18n/config';
import { gamesMetadata } from '../../../../games-site/site';
import GameIntroduction from '@/components/content/GameIntroduction';

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return gamesMetadata(params.locale, true);
}

// Pages redirects this old introduction; the legacy runtime remains for existing saves.
export default function SewerKingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return <GameIntroduction locale={params.locale} backHref={`/${params.locale}/#games`} />;
}
