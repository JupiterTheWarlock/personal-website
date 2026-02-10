'use client';

import React, { useRef, useState, useEffect } from 'react';
import SocialLinks from '@/components/content/SocialLinks';
import AsciiAvatar from '@/components/content/AsciiAvatar';
import SaturnJupiterVector from '@/components/animations/SaturnJupiterVector';

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
  const leftContentRef = useRef<HTMLDivElement>(null);
  const [jupiterSize, setJupiterSize] = useState(200);

  useEffect(() => {
    const updateJupiterSize = () => {
      if (leftContentRef.current) {
        const height = leftContentRef.current.offsetHeight;
        // ASCII 字符渲染会缩小显示，需要放大系数
        // charSize=8px, lineHeight=6.4px, scale=0.5, 所以需要约 3-4 倍放大
        const scaleFactor = 2;
        setJupiterSize(Math.max(height * scaleFactor, 300)); // 最小高度 300
      }
    };

    updateJupiterSize();
    window.addEventListener('resize', updateJupiterSize);
    return () => window.removeEventListener('resize', updateJupiterSize);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <div className="flex flex-row flex-nowrap items-stretch gap-6" style={{ display: 'flex', flexDirection: 'row' }}>
            {/* 左侧内容区域 */}
            <div ref={leftContentRef} className="flex-1" style={{ minWidth: 0 }}>
              <div className="flex flex-col items-center gap-6 mb-4">
                <AsciiAvatar
                  src="https://cfr2cdn.jthewl.cc/头像.jpg"
                  alt="Jupiter The Warlock"
                  size={128}
                  className="hover:scale-105 transition-transform"
                />
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl mb-2 glow-text">
                    {t.title}
                  </h1>
                  <h2 className="text-xl md:text-2xl text-[var(--terminal-white)] glow-white">
                    {t.subtitle}
                  </h2>
                </div>
              </div>
              <p className="text-lg text-[var(--text-secondary)]">
                {t.intro}
              </p>
            </div>
            {/* 右侧木星 - 带星环，高度自适应基本信息栏 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 'auto',
                alignSelf: 'stretch',
                height: 'auto',
              }}
            >
              <SaturnJupiterVector className="hover:scale-105 transition-transform" size={jupiterSize} />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <div className="flex flex-row flex-nowrap items-stretch gap-6" style={{ display: 'flex', flexDirection: 'row' }}>
            {/* 左侧内容 */}
            <div className="flex-1" style={{ minWidth: 0 }}>
              <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)]">
                {'// ABOUT ME'}
              </h3>
              <p className="mb-4 whitespace-pre-wrap leading-relaxed">
                {t.description}
              </p>

              {/* Skills */}
              <div className="mt-6">
                <h4 className="text-lg mb-3 text-[var(--terminal-white)] glow-white">
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
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4">
          <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)]">
            {'// ' + t.social_title.toUpperCase()}
          </h3>
          <SocialLinks />
        </div>
      </section>

      {/* Contact Section */}
      <section className="terminal-window p-6">
        <div className="ascii-border p-4 text-center">
          <p className="text-[var(--terminal-white)] glow-white text-lg mb-2">
            {t.contact}
          </p>
          <p className="text-[var(--text-secondary)] text-sm">
            <a href="https://github.com/JupiterTheWarlock" target="_blank" rel="noopener noreferrer">
              GitHub: @JupiterTheWarlock
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
