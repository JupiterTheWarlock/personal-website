'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'work', label: { 'zh-CN': '作品', 'en-US': 'Work' } },
  { key: 'method', label: { 'zh-CN': '方法', 'en-US': 'Method' } },
  { key: 'notes', label: { 'zh-CN': '笔记', 'en-US': 'Notes' } },
  { key: 'workshop', label: { 'zh-CN': '工作台', 'en-US': 'Workshop' } },
  { key: 'contact', label: { 'zh-CN': '联系', 'en-US': 'Contact' } },
];

export default function Header() {
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-mark" href={`/${locale}/#home`} aria-label="Jupiter The Warlock home">
          <span className="site-mark-dot" aria-hidden="true" />
          <span>JTW</span>
        </a>

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
