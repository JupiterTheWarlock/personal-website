import HomeContent from '@/components/content/HomeContent';
import { getMessages } from '@/app/i18n/messages';
import { getHomeContent } from '@/app/content/localized';

export default function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const { hero, nav, social } = getMessages(locale);

  return <HomeContent copy={{ hero, nav, social }} content={getHomeContent(locale)} />;
}
