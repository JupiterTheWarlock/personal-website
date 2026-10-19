import { notFound } from 'next/navigation';
import { locales, isLocale } from '../../../app/i18n/config';
import { getMessages } from '../../../app/i18n/messages';
import SceneProvider from '../../../components/content/SceneProvider';
import GamesHeader from '../../components/GamesHeader';
import '../../../app/globals.css';
import '../games.css';

export function generateStaticParams() { return locales.map(locale => ({ locale })); }

export default function Layout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const copy = getMessages(params.locale);
  return <html lang={params.locale}><body className="games-site">
    <GamesHeader locale={params.locale} title={copy.nav.games} label={copy.language} />
    <main><SceneProvider background={false}>{children}</SceneProvider></main>
  </body></html>;
}
