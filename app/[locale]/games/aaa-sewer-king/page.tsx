import { notFound } from 'next/navigation';
import Image from 'next/image';
import { isLocale } from '@/app/i18n/config';
import { getMessages } from '@/app/i18n/messages';
import { localizedMetadata } from '@/app/i18n/metadata';
import UnityPlayer from '@/components/content/UnityPlayer';
import { sewerKingArtwork } from '@/app/content/sewer-king';

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const copy = getMessages(params.locale).sewerKing;
  return localizedMetadata(params.locale, 'games/aaa-sewer-king/', { title: copy.title, description: copy.description });
}

export default function SewerKingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const copy = getMessages(params.locale).sewerKing;
  return (
    <article className="game-page">
      <a className="game-back game-link" href={`/${params.locale}/#games`}>← {copy.back}</a>
      <header className="game-heading">
        <p className="game-version">{copy.edition} · 0.3.6</p>
        <h1>{copy.title}</h1>
        <p className="game-description">{copy.tagline}</p>
        <p className="game-note">{copy.gameLanguage}</p>
      </header>
      <UnityPlayer copy={copy} />
      <div className="game-overview">
        <figure className="game-artwork">
          <Image src={sewerKingArtwork(params.locale)} alt={copy.artworkAlt} width={1920} height={1080} />
          <figcaption>{copy.artworkCaption}</figcaption>
        </figure>
        <div>
          <p className="game-description">{copy.description}</p>
          <p className="game-note">{copy.assetNote}</p>
        </div>
      </div>
      <div className="game-details">
        <section>
          <h2>{copy.controlsTitle}</h2>
          <h3>{copy.desktopTitle}</h3>
          <p>{copy.desktopCombat}</p>
          <p>{copy.desktopMap}</p>
          <h3>{copy.touchTitle}</h3>
          <p>{copy.touchControls}</p>
          <p>{copy.platformNote}</p>
        </section>
        <section>
          <h2>{copy.beginnerTitle}</h2>
          <p>{copy.beginnerNote}</p>
          <h2>{copy.saveTitle}</h2>
          <p>{copy.saveNote}</p>
        </section>
      </div>
    </article>
  );
}
