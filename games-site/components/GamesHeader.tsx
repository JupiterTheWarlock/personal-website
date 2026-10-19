'use client';
import { locales, localeNames, localeCookie, isLocale, type Locale } from '../../app/i18n/config';
import { gamesPath } from '../site';

export default function GamesHeader({ locale, title, label }: { locale: Locale; title: string; label: string }) {
  return <header className="games-header">
    <a className="games-brand" href={gamesPath('/', locale)}>{title}</a>
    <label className="language-switcher">
      <span className="sr-only">{label}</span>
      <select className="language-select" value={locale} onChange={event => {
        const next = event.target.value;
        if (!isLocale(next)) return;
        document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        const url = new URL(location.href);
        url.searchParams.set('lang', next);
        location.assign(url.href);
      }}>
        {locales.map(value => <option key={value} value={value} lang={value}>{localeNames[value]}</option>)}
      </select>
    </label>
  </header>;
}
