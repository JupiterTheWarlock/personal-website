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
      {/* Hero Section */}
      <section className="hero-section">
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

      {/* About Section */}
      <SectionCard title="// ABOUT">
        <div className="about-section">
          <div className="about-text">
            <p className="whitespace-pre-wrap leading-relaxed">
              {t.description}
            </p>
          </div>
          <div className="skills-section">
            <h4 className="text-lg mb-3 text-[var(--terminal-white)] glow-white">
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

      {/* Contact Section */}
      <SectionCard title={`// ${t.social_title.toUpperCase()}`}>
        <div className="contact-section text-center">
          <p className="text-[var(--terminal-white)] glow-white text-lg mb-2">
            {t.contact}
          </p>
          <SocialLinks />
        </div>
      </SectionCard>
    </div>
  );
}
