'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'home', label: { 'zh-CN': '首页', 'en-US': 'Home' } },
  { key: 'blog', label: { 'zh-CN': '博客', 'en-US': 'Blog' }, external: 'https://blog.jthewl.cc' },
  { key: 'stars', label: { 'zh-CN': 'Stars', 'en-US': 'Stars' }, external: 'https://stars.jthewl.cc' },
  { key: 'tools', label: { 'zh-CN': '工具集', 'en-US': 'Tools' }, disabled: true },
  { key: 'projects', label: { 'zh-CN': '项目', 'en-US': 'Projects' }, external: 'https://jupiter-the-warlock.itch.io/' },
];

export default function Header() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';

  const handleNav = (item: typeof navItems[0]) => {
    if (item.disabled) return;
    if (item.key === 'home') {
      router.push(`/${locale}`);
    }
  };

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-50">
      <div className="site-header-inner">
        <div className="site-mark">
          <span className="site-mark-dot" aria-hidden="true" />
          <span>JTW</span>
        </div>

        <nav className="site-nav">
          {navItems.map((item) => {
            const label = item.label[locale as keyof typeof item.label] || item.label['zh-CN'];
            const isDisabled = item.disabled;

            if (item.external && !isDisabled) {
              return (
                <a
                  key={item.key}
                  href={item.external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                >
                  {label}
                </a>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => handleNav(item)}
                disabled={isDisabled}
                className={`nav-link ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed text-[var(--text-secondary)]'
                    : ''
                }`}
              >
                {isDisabled ? `${label} (Coming Soon)` : label}
              </button>
            );
          })}
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
