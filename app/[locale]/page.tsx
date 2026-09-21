import HomeContent from '@/components/content/HomeContent';
import { locales } from '@/app/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const titles = {
  'zh-CN': '术士木星',
  'en-US': 'Jupiter The Warlock',
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const title = titles[locale as keyof typeof titles] || titles['zh-CN'];

  return <HomeContent locale={locale} title={title} />;
}
