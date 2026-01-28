import React from 'react';
import SocialLinks from '@/components/content/SocialLinks';

const translations = {
  'zh-CN': {
    title: '术士木星',
    subtitle: '独立游戏开发者',
    intro: '欢迎来到我的个人空间',
    description: `我是一个独立游戏开发者，专注于创造独特的游戏体验。
我的工作涵盖了游戏设计、开发和创意编程。
我热爱将技术与艺术融合，创造令人难忘的作品。`,
    skills: ['游戏开发', '独立创作', '创意编程', '游戏设计'],
    contact: '联系我',
    social_title: '社交媒体',
  },
  'en-US': {
    title: 'Jupiter The Warlock',
    subtitle: 'Indie Game Developer',
    intro: 'Welcome to my personal space',
    description: `I am an indie game developer focused on creating unique gaming experiences.
My work spans game design, development, and creative programming.
I love blending technology with art to create memorable works.`,
    skills: ['Game Development', 'Indie Creation', 'Creative Programming', 'Game Design'],
    contact: 'Contact Me',
    social_title: 'Social Media',
  },
};

export default function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const t = translations[locale as keyof typeof translations] || translations['zh-CN'];

  return (
    <div>
      {/* Hero Section */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <h1 className="text-3xl md:text-4xl mb-2 glow-text">
            {t.title}
          </h1>
          <h2 className="text-xl md:text-2xl text-[var(--terminal-cyan)] glow-cyan mb-4">
            {t.subtitle}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-4">
            {t.intro}
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <h3 className="text-xl mb-4 glow-text text-[var(--terminal-green)]">
            {'// ABOUT ME'}
          </h3>
          <p className="mb-4 whitespace-pre-wrap leading-relaxed">
            {t.description}
          </p>

          {/* Skills */}
          <div className="mt-6">
            <h4 className="text-lg mb-3 text-[var(--terminal-cyan)] glow-cyan">
              {'// SKILLS'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {t.skills.map((skill) => (
                <span
                  key={skill}
                  className="ascii-button text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <h3 className="text-xl mb-4 glow-text text-[var(--terminal-green)]">
            {'// ' + t.social_title.toUpperCase()}
          </h3>
          <SocialLinks />
        </div>
      </section>

      {/* Contact Section */}
      <section className="terminal-window p-6">
        <div className="ascii-border p-4 text-center">
          <p className="text-[var(--terminal-cyan)] glow-cyan text-lg mb-2">
            {t.contact}
          </p>
          <p className="text-[var(--text-secondary)] text-sm">
            <a href="https://github.com/JupiterTheWarlock" target="_blank" rel="noopener noreferrer">
              GitHub: @JupiterTheWarlock
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
