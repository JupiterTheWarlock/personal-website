import { notFound } from 'next/navigation';
import { isLocale } from '@/app/i18n/config';
import { getMessages } from '@/app/i18n/messages';
import { localizedMetadata } from '@/app/i18n/metadata';
import UnityPlayer from '@/components/content/UnityPlayer';

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
        <p className="game-description">{copy.description}</p>
      </header>
      <UnityPlayer copy={copy} />
      <div className="game-details">
        <section>
          <h2>{copy.controlsTitle}</h2>
          <p>{copy.controls}</p>
          <p>{copy.gameLanguage}</p>
        </section>
        <section>
          <h2>{copy.saveTitle}</h2>
          <p>{copy.saveNote}</p>
        </section>
      </div>
    </article>
  );
}
