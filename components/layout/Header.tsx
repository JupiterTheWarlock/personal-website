import React from 'react';
import type { Locale } from '@/app/i18n/config';
import type { Messages } from '@/app/i18n/messages';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = ['games', 'exploring', 'notes', 'contact'] as const;

export default function Header({ locale, nav, languageLabel }: {
  locale: Locale;
  nav: Messages['nav'];
  languageLabel: string;
}) {

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <nav className="site-nav" aria-label={nav.label}>
          {navItems.map((item) => {
            return (
              <a key={item} href={`/${locale}/#${item}`} className="nav-link">
                {nav[item]}
              </a>
            );
          })}
        </nav>

        <LanguageSwitcher label={languageLabel} />
      </div>
    </header>
  );
}
