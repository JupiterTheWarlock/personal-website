'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locales, localeNames, localeCookie, isLocale, fallbackLocale, type Locale } from '@/app/i18n/config';
import { localizedPath } from '@/app/i18n/routing';

export default function LanguageSwitcher({ label }: { label: string }) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = isLocale(params?.locale as string) ? params.locale as Locale : fallbackLocale;

  const handleLocaleChange = (newLocale: Locale) => {
    if (!isLocale(newLocale) || newLocale === currentLocale) return;
    document.cookie = `${localeCookie}=${newLocale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    const path = localizedPath(window.location.pathname, newLocale);
    router.push(`${path}${window.location.search}${window.location.hash}`, { scroll: false });
  };

  return (
    <label className="language-switcher">
      <span className="sr-only">{label}</span>
      <select
        className="language-select"
        value={currentLocale}
        onChange={(event) => handleLocaleChange(event.target.value as Locale)}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale} lang={locale}>{localeNames[locale]}</option>
        ))}
      </select>
    </label>
  );
}
