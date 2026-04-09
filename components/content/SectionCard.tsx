'use client';

import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function SectionCard({ children, title, className = '' }: SectionCardProps) {
  return (
    <section className={`section-card ${className}`}>
      {title && (
        <div className="section-card-header">
          <pre className="text-[var(--terminal-gray)]">
            {`── ${title} ${'─'.repeat(Math.max(0, 40 - title.length))}`}
          </pre>
        </div>
      )}
      <div className="section-card-content">
        {children}
      </div>
    </section>
  );
}
