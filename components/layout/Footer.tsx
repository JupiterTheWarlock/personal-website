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
              &copy; {currentYear} Jupiter The Warlock
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a
                href="https://github.com/JupiterTheWarlock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-primary)] hover:text-[var(--accent-bright)]"
              >
                GitHub
              </a>
              <span className="text-[var(--border-light)]">|</span>
              <a
                href="mailto:jupiterthewarlock679@gmail.com"
                className="text-[var(--text-primary)] hover:text-[var(--accent-bright)]"
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
