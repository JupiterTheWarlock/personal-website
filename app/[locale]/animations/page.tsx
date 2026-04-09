import React from 'react';
import { locales } from '@/app/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const translations = {
  'zh-CN': {
    title: 'ASCII 动画展示',
    comingSoon: '即将推出...',
    back: '返回首页',
  },
  'en-US': {
    title: 'ASCII Animation Showcase',
    comingSoon: 'Coming Soon...',
    back: 'Back to Home',
  },
};

export default async function AnimationsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations['zh-CN'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-xl text-gray-400">{t.comingSoon}</p>
    </div>
  );
}
