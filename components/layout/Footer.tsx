'use client';

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-6 relative z-10">
      <div className="container mx-auto px-4">
        <div className="section-card">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] text-sm mb-2">
              © {currentYear} Jupiter The Warlock
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a
                href="https://github.com/JupiterTheWarlock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--terminal-gray)] hover:text-[var(--terminal-white)]"
              >
                GitHub
              </a>
              <span className="text-[var(--text-secondary)]">|</span>
              <a
                href="mailto:contact@jthewl.cc"
                className="text-[var(--terminal-gray)] hover:text-[var(--terminal-white)]"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
