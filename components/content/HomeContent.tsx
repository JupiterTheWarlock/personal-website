'use client';

import SectionCard from './SectionCard';
import SocialLinks from './SocialLinks';

interface SiteLink {
  name: string;
  url: string;
  description: string;
  ascii: string;
}

interface ProjectLink {
  name: string;
  url: string;
  cover: string;
}

interface HomeContentProps {
  translations: {
    title: string;
    subtitle: string;
    intro: string;
    description: string;
    skills: string[];
    contact: string;
    social_title: string;
    sites_title: string;
    projects_title: string;
    sites: SiteLink[];
    projects: ProjectLink[];
    visit: string;
  };
}

export default function HomeContent({ translations: t }: HomeContentProps) {
  const featuredProjects = t.projects.slice(0, 3);

  return (
    <div className="home-content">
      {/* Layer 1: Hero — full viewport */}
      <section className="content-section hero-section">
        <div className="hero-content">
          <div className="hero-copy">
            <p className="hero-kicker">JUPITER_THE_WARLOCK / PERSONAL HUB</p>
            <h1 className="hero-title">
              {t.title}
            </h1>
            <h2 className="hero-subtitle">
              {t.subtitle}
            </h2>
            <p className="hero-intro">
              {t.intro}
            </p>
            <div className="hero-actions">
              <a className="hero-action primary" href="https://jupiter-the-warlock.itch.io/" target="_blank" rel="noopener noreferrer">
                PLAY_GAMES
              </a>
              <a className="hero-action" href="https://blog.jthewl.cc" target="_blank" rel="noopener noreferrer">
                READ_BLOG
              </a>
            </div>
          </div>

          <aside className="hero-console" aria-label="featured projects">
            <div className="hero-console-header">
              <span>live_index</span>
              <span>public</span>
            </div>
            <div className="hero-console-body">
              <div className="hero-status-row">
                <span>focus</span>
                <strong>{t.subtitle}</strong>
              </div>
              <div className="hero-status-row">
                <span>motto</span>
                <strong>{t.intro}</strong>
              </div>
              <div className="hero-project-list">
                {featuredProjects.map((project, index) => (
                  <a
                    key={project.name}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-project-link"
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{project.name}</strong>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <div className="scroll-indicator" aria-hidden="true">
          <span className="blink-cursor">▼</span>
        </div>
      </section>

      {/* Layer 2: About — full viewport */}
      <section className="content-section">
        <div className="w-full max-w-3xl">
          <SectionCard title="// ABOUT">
            <div className="about-section">
              <div className="about-text">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {t.description}
                </p>
              </div>
              <div className="skills-section">
                <h4 className="text-lg mb-3 text-[var(--accent)] glow-text">
                  {'// SKILLS'}
                </h4>
                <div className="skills-tags">
                  {t.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      [{skill}]
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* Layer 3: My Sites — full viewport */}
      <section className="content-section">
        <div className="w-full max-w-3xl">
          <SectionCard title={`// ${t.sites_title.toUpperCase()}`}>
            <div className="sites-grid">
              {t.sites.map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-card"
                >
                  <div className="site-card-ascii">
                    <pre className="text-xs leading-none">{site.ascii}</pre>
                  </div>
                  <div className="site-card-info">
                    <h3 className="site-card-name">{site.name}</h3>
                    <p className="site-card-desc">{site.description}</p>
                    <span className="site-card-link">
                      {t.visit} →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* Layer 4: Contact — full viewport */}
      <section className="content-section">
        <div className="w-full max-w-3xl">
          <SectionCard title={`// ${t.projects_title.toUpperCase()}`}>
            <div className="projects-grid">
              {t.projects.map((project) => (
                <a
                  key={project.name}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-card"
                >
                  <img
                    src={project.cover}
                    alt={project.name}
                    className="project-cover"
                    loading="lazy"
                  />
                  <div className="project-name">{project.name}</div>
                </a>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* Layer 5: Contact — full viewport */}
      <section className="content-section">
        <div className="w-full max-w-3xl">
          <SectionCard title={`// ${t.social_title.toUpperCase()}`}>
            <div className="contact-section text-center">
              <p className="text-[var(--text-bright)] glow-bright text-lg mb-4">
                {t.contact}
              </p>
              <SocialLinks />
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
