import React from 'react';

export default function Footer() {
  return (
    <footer className="terminal-window mt-8 p-4">
      <div className="ascii-border p-2">
        <pre className="text-[var(--terminal-green)] text-sm text-center">
{`╔══════════════════════════════════════════════════════╗
║  © 2025 Jupiter The Warlock. All rights reserved.      ║
║  Made with ♥ and ASCII art                            ║
╚══════════════════════════════════════════════════════╝`}
        </pre>
      </div>
    </footer>
  );
}
