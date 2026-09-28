'use client';

/* eslint-disable @next/next/no-img-element */
import {
  avatarUrl,
  type ContentCardData,
} from '@/app/content/home';
import type { Messages } from '@/app/i18n/messages';
import { usePresentationModeCycle } from '@/hooks/usePresentationModeCycle';
import { useTiltCardMotion } from '@/hooks/useTiltCardMotion';
import SocialLinks from './SocialLinks';

interface HomeContentProps {
  copy: Pick<Messages, 'hero' | 'nav' | 'social'>;
  content: { games: ContentCardData[]; explorations: ContentCardData[]; notes: ContentCardData[] };
}

function excerpt(text: string, length = 88) {
  const characters = Array.from(text.trim());
  return characters.length > length
    ? `${characters.slice(0, length).join('')}…`
    : text.trim();
}

function ContentGrid({
  items,
  articleLayout = false,
}: {
  items: ContentCardData[];
  articleLayout?: boolean;
}) {
  return (
    <div className={`content-card-grid${articleLayout ? ' article-card-grid' : ''}`}>
      {items.map((item) => (
        <a
          key={item.url}
          className={`content-card${articleLayout ? ' content-card--article' : ''}${!item.image ? ' content-card--text-only' : ''}`}
          data-tilt-card={articleLayout ? undefined : true}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.image ? (
            <span className="content-card-image">
              <img src={item.image} alt="" loading="lazy" />
            </span>
          ) : null}
          <span className="content-card-copy">
            <strong>{item.title}</strong>
            <span>{excerpt(item.description)}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export default function HomeContent({ copy, content }: HomeContentProps) {
  const { games, explorations, notes } = content;
  usePresentationModeCycle();
  useTiltCardMotion();

  return (
    <div className="home-shell">
      <section id="home" className="lab-hero">
        <div className="hero-copy">
          <h1>{copy.hero.title}</h1>
          <p className="hero-subtitle">{copy.hero.subtitle}</p>
          <p className="hero-slogan">{copy.hero.slogan}</p>
        </div>
      </section>

      <div className="home-panels">
        <section id="games" className="lab-section">
          <div className="section-heading">
            <h2>{copy.nav.games}</h2>
          </div>
          <ContentGrid items={games} />
        </section>

        <section id="exploring" className="lab-section">
          <div className="section-heading">
            <h2>{copy.nav.exploring}</h2>
          </div>
          <ContentGrid items={explorations} />
        </section>

        <section id="notes" className="lab-section">
          <div className="section-heading">
            <h2>{copy.nav.notes}</h2>
          </div>
          <ContentGrid items={notes} articleLayout />
        </section>

        <section id="contact" className="lab-section">
          <div className="section-heading">
            <h2>{copy.nav.contact}</h2>
          </div>
          <div className="contact-card">
            <img className="contact-avatar" src={avatarUrl} alt={copy.hero.title} loading="lazy" />
            <div className="contact-details">
              <a className="contact-email" href="mailto:jupiterthewarlock679@gmail.com">
                jupiterthewarlock679@gmail.com ↗
              </a>
              <SocialLinks labels={copy.social} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
