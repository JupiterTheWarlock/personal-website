'use client';

import SectionCard from './SectionCard';
import SocialLinks from './SocialLinks';

interface HomeContentProps {
  translations: {
    title: string;
    subtitle: string;
    intro: string;
    description: string;
    skills: string[];
    contact: string;
    social_title: string;
  };
}

export default function HomeContent({ translations: t }: HomeContentProps) {
  return (
    <div className="home-content">
      {/* Layer 1: Hero — full viewport */}
      <section className="content-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {t.title}
          </h1>
          <h2 className="hero-subtitle">
            {t.subtitle}
          </h2>
          <p className="hero-intro">
            {t.intro}
          </p>
          <div className="hero-social">
            <SocialLinks />
          </div>
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

      {/* Layer 3: Contact — full viewport */}
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
