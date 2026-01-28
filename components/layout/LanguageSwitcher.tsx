'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/app/i18n/config';

export default function LanguageSwitcher() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || 'zh-CN';

  const handleLocaleChange = (newLocale: Locale) => {
    const path = window.location.pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <div className="flex gap-2 items-center">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`ascii-button text-sm ${
            locale === currentLocale
              ? 'bg-[var(--terminal-green)] text-[var(--deep-black)]'
              : ''
          }`}
          title={localeNames[locale]}
        >
          {localeFlags[locale]} {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
