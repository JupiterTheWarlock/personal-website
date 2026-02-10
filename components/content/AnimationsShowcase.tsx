'use client';

import React from 'react';
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
            <div className="flex justify-center items-center py-8 bg-black/20">
              <RotatingSquare size={300} charSize={10} />
            </div>
          </div>
        </div>

        {/* Wave Particles */}
        <div className="terminal-window p-6">
          <div className="ascii-border p-4">
            <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)] text-center">
              {'// ' + translations.examples.wave.toUpperCase()}
            </h3>
            <div className="flex justify-center items-center py-8 bg-black/20">
              <WaveParticles width={500} height={200} charSize={8} color="#7DD3FC" />
            </div>
          </div>
        </div>

        {/* Fractal Tree */}
        <div className="terminal-window p-6">
          <div className="ascii-border p-4">
            <h3 className="text-xl mb-4 glow-text text-[var(--terminal-gray)] text-center">
              {'// ' + translations.examples.fractal.toUpperCase()}
            </h3>
            <div className="flex justify-center items-center py-8 bg-black/20">
              <FractalTree size={350} charSize={8} color="#90EE90" />
            </div>
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
