import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isLocale } from '../../../app/i18n/config';
import { getMessages } from '../../../app/i18n/messages';
import { sewerKingArtwork } from '../../../app/content/sewer-king';
import { gamesMetadata, gamesPath, gameSlug } from '../../site';

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return gamesMetadata(params.locale);
}

export default function GamesHome({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const copy = getMessages(params.locale).sewerKing;
  return <section className="games-home">
    <h1>{copy.back}</h1>
    <a className="games-card" href={gamesPath(`/${gameSlug}/`, params.locale)}>
      <Image src={sewerKingArtwork(params.locale)} alt={copy.artworkAlt} width={1920} height={1080} priority />
      <div><h2>{copy.title}</h2><p>{copy.tagline}</p><span>{copy.edition} · 0.3.6</span></div>
    </a>
  </section>;
}
