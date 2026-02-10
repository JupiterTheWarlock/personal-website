'use client';

import React, { useState, useEffect, useRef } from 'react';
import RotatingSquare from '@/components/animations/RotatingSquare';
import WaveParticles from '@/components/animations/WaveParticles';
import FractalTree from '@/components/animations/FractalTree';

interface AnimationsShowcaseProps {
  translations: {
    title: string;
    subtitle: string;
    description: string;
    examples: {
      rotating: string;
      wave: string;
      fractal: string;
    };
    back: string;
  };
  locale: string;
}

// 懒加载动画组件的包装器
function LazyAnimation({
  children,
  placeholder,
}: {
  children: React.ReactNode;
  placeholder: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center items-center py-8 bg-black/20 min-h-[300px]">
      {isVisible ? children : <div className="text-[var(--text-secondary)]">{placeholder}</div>}
    </div>
  );
}

export default function AnimationsShowcase({ translations, locale }: AnimationsShowcaseProps) {
  return (
    <div>
      {/* Header */}
      <section className="terminal-window p-6 mb-8">
        <div className="ascii-border p-4 text-center">
          <h1 className="text-3xl md:text-4xl mb-2 glow-text">
            {translations.title}
          </h1>
          <h2 className="text-xl md:text-2xl text-[var(--terminal-white)] glow-white mb-4">
            {translations.subtitle}
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            {translations.description}
          </p>
        </div>
      </section>

      {/* Animations Grid */}
      <section className="space-y-8">
        {/* Rotating Square */}
        <div className="terminal-window p-6">
          <div className="ascii-border p-4">
            <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)] text-center">
              {'// ' + translations.examples.rotating.toUpperCase()}
            </h3>
            <LazyAnimation placeholder="Loading animation...">
              <RotatingSquare size={300} charSize={10} />
            </LazyAnimation>
          </div>
        </div>

        {/* Wave Particles */}
        <div className="terminal-window p-6">
          <div className="ascii-border p-4">
            <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)] text-center">
              {'// ' + translations.examples.wave.toUpperCase()}
            </h3>
            <LazyAnimation placeholder="Loading animation...">
              <WaveParticles width={500} height={200} charSize={8} color="#7DD3FC" />
            </LazyAnimation>
          </div>
        </div>

        {/* Fractal Tree */}
        <div className="terminal-window p-6">
          <div className="ascii-border p-4">
            <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)] text-center">
              {'// ' + translations.examples.fractal.toUpperCase()}
            </h3>
            <LazyAnimation placeholder="Loading animation...">
              <FractalTree size={350} charSize={8} color="#90EE90" />
            </LazyAnimation>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <section className="terminal-window p-6 mt-8">
        <div className="ascii-border p-4 text-center">
          <a
            href={`/${locale}`}
            className="ascii-button inline-block"
          >
            {translations.back}
          </a>
        </div>
      </section>
    </div>
  );
}
