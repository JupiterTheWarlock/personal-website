'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'games', label: { 'zh-CN': '游戏', 'en-US': 'Games' } },
  { key: 'exploring', label: { 'zh-CN': '探索', 'en-US': 'Exploring' } },
  { key: 'notes', label: { 'zh-CN': '笔记', 'en-US': 'Notes' } },
  { key: 'contact', label: { 'zh-CN': '联系', 'en-US': 'Contact' } },
];

export default function Header() {
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const label = item.label[locale as keyof typeof item.label] || item.label['zh-CN'];

            return (
              <a key={item.key} href={`/${locale}/#${item.key}`} className="nav-link">
                {label}
              </a>
            );
          })}
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
