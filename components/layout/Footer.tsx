'use client';

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-panel">
        <p>&copy; {currentYear} Jupiter The Warlock</p>
        <div className="footer-links">
          <a href="https://github.com/JupiterTheWarlock" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="mailto:jupiterthewarlock679@gmail.com">Email</a>
        </div>
      </div>
    </footer>
  );
}
