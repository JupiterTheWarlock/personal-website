import React from 'react';
import { locales } from '@/app/i18n/config';
import dynamic from 'next/dynamic';

// 动态导入以禁用 SSR
const HomeContent = dynamic(
  () => import('@/components/content/HomeContent'),
  { ssr: false }
);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const translations = {
  'zh-CN': {
    title: '术士木星',
    subtitle: '独立游戏开发者',
    intro: '欢迎来到我的个人空间',
    description: `我是一个独立游戏开发者，专注于创造独特的游戏体验。
我的工作涵盖了游戏设计、开发和创意编程。
我热爱将技术与艺术融合，创造令人难忘的作品。`,
    skills: ['游戏开发', '独立创作', '创意编程', '游戏设计'],
    contact: '联系我',
    social_title: '社交媒体',
  },
  'en-US': {
    title: 'Jupiter The Warlock',
    subtitle: 'Indie Game Developer',
    intro: 'Welcome to my personal space',
    description: `I am an indie game developer focused on creating unique gaming experiences.
My work spans game design, development, and creative programming.
I love blending technology with art to create memorable works.`,
    skills: ['Game Development', 'Indie Creation', 'Creative Programming', 'Game Design'],
    contact: 'Contact Me',
    social_title: 'Social Media',
  },
};

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations['zh-CN'];

  return <HomeContent translations={t} />;
}
