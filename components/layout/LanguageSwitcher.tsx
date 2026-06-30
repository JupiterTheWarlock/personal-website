'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/app/i18n/config';

export default function LanguageSwitcher() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || 'zh-CN';

  const handleLocaleChange = (newLocale: Locale) => {
    const path = window.location.pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <div className="language-switcher" aria-label="Language switcher">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`language-button ${
            locale === currentLocale
              ? 'is-active'
              : ''
          }`}
          title={localeNames[locale]}
          aria-pressed={locale === currentLocale}
        >
          {locale === 'zh-CN' ? '中' : 'EN'}
        </button>
      ))}
    </div>
  );
}
