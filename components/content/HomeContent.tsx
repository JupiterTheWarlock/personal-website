'use client';

/* eslint-disable @next/next/no-img-element */
import {
  avatarUrl,
  explorations,
  games,
  notes,
  type ContentCardData,
} from '@/app/content/home';
import SocialLinks from './SocialLinks';

interface HomeContentProps {
  locale: string;
  title: string;
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

export default function HomeContent({ locale, title }: HomeContentProps) {
  const isZh = locale === 'zh-CN';

  return (
    <div className="home-shell">
      <section id="home" className="lab-hero">
        <div className="hero-copy">
          <h1>{title}</h1>
          <p className="hero-subtitle">{isZh ? '独立游戏开发者' : 'Indie game developer'}</p>
        </div>
      </section>

      <div className="home-panels">
        <section id="games" className="lab-section">
          <div className="section-heading">
            <h2>{isZh ? '游戏' : 'Games'}</h2>
          </div>
          <ContentGrid items={games} />
        </section>

        <section id="exploring" className="lab-section">
          <div className="section-heading">
            <h2>{isZh ? '探索' : 'Exploring'}</h2>
          </div>
          <ContentGrid items={explorations} />
        </section>

        <section id="notes" className="lab-section">
          <div className="section-heading">
            <h2>{isZh ? '笔记' : 'Notes'}</h2>
          </div>
          <ContentGrid items={notes} articleLayout />
        </section>

        <section id="contact" className="lab-section">
          <div className="section-heading">
            <h2>{isZh ? '联系' : 'Contact'}</h2>
          </div>
          <div className="contact-card">
            <img className="contact-avatar" src={avatarUrl} alt={title} loading="lazy" />
            <div className="contact-details">
              <a className="contact-email" href="mailto:jupiterthewarlock679@gmail.com">
                jupiterthewarlock679@gmail.com ↗
              </a>
              <SocialLinks />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
