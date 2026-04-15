'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'home', label: { 'zh-CN': '首页', 'en-US': 'Home' } },
  { key: 'blog', label: { 'zh-CN': '博客', 'en-US': 'Blog' }, external: 'https://blog.jthewl.cc' },
  { key: 'tools', label: { 'zh-CN': '工具集', 'en-US': 'Tools' }, disabled: true },
  { key: 'projects', label: { 'zh-CN': '项目', 'en-US': 'Projects' }, disabled: true },
];

export default function Header() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';

  const handleNav = (item: typeof navItems[0]) => {
    if (item.disabled) return;
    if (item.external) {
      window.open(item.external, '_blank', 'noopener,noreferrer');
    } else if (item.key === 'home') {
      router.push(`/${locale}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg-card)] border-b border-[var(--border)]">
      <div className="container mx-auto px-4 py-3">
        <div className="ascii-border p-2 mb-2 bg-[var(--bg-deep)]/60">
          <pre className="text-[var(--accent)] glow-text text-sm">
{`╔════════════════════════════════════════════════════╗
║  JUPITER THE WARLOCK - INDIE GAME DEVELOPER        ║
╚════════════════════════════════════════════════════╝`}
          </pre>
        </div>

        <nav className="flex flex-wrap gap-2 justify-center">
          {navItems.map((item) => {
            const label = item.label[locale as keyof typeof item.label] || item.label['zh-CN'];
            const isDisabled = item.disabled;

            return (
              <button
                key={item.key}
                onClick={() => handleNav(item)}
                disabled={isDisabled}
                className={`ascii-button text-sm ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed border-[var(--border)] text-[var(--text-secondary)]'
                    : ''
                }`}
              >
                {isDisabled ? `${label} (Coming Soon)` : label}
              </button>
            );
          })}
        </nav>

        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-[var(--accent)]">
            <span className="blink-cursor">_</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
