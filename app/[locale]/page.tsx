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
    subtitle: 'AI Native的独立游戏开发者',
    intro: 'AI 接管低维，人类专注高维',
    description: `我是一个独立游戏开发者，专注于创造独特的游戏体验。
我的工作涵盖了游戏设计、开发和创意编程。
我热爱将技术与艺术融合，创造令人难忘的作品。`,
    skills: ['游戏开发', '独立创作', '创意编程', '游戏设计', 'React', 'Three.js', 'TypeScript'],
    contact: '联系我',
    social_title: '社交媒体',
    sites_title: '我的站点',
    visit: '访问',
    sites: [
      {
        name: 'Blog',
        url: 'https://blog.jthewl.cc',
        description: '基于 NotionNext 的个人博客，记录技术、游戏开发与思考',
        ascii:
`  ╔═══╗
  ║ ▶ ║  BLOG
  ╚═══╝`,
      },
      {
        name: 'Stars',
        url: 'https://stars.jthewl.cc',
        description: 'GitHub Stars 看板，收藏的开源项目与工具集',
        ascii:
`  ╔═══╗
  ║ ★ ║  STARS
  ╚═══╝`,
      },
    ],
  },
  'en-US': {
    title: 'Jupiter The Warlock',
    subtitle: 'AI Native Indie Game Developer',
    intro: 'AI handles the low-dimensional, humans focus on the high-dimensional',
    description: `I am an indie game developer focused on creating unique gaming experiences.
My work spans game design, development, and creative programming.
I love blending technology with art to create memorable works.`,
    skills: ['Game Development', 'Indie Creation', 'Creative Programming', 'Game Design', 'React', 'Three.js', 'TypeScript'],
    contact: 'Contact Me',
    social_title: 'Social Media',
    sites_title: 'My Sites',
    visit: 'Visit',
    sites: [
      {
        name: 'Blog',
        url: 'https://blog.jthewl.cc',
        description: 'Personal blog powered by NotionNext — tech, gamedev, and thoughts',
        ascii:
`  ╔═══╗
  ║ ▶ ║  BLOG
  ╚═══╝`,
      },
      {
        name: 'Stars',
        url: 'https://stars.jthewl.cc',
        description: 'GitHub Stars board — curated open source projects and tools',
        ascii:
`  ╔═══╗
  ║ ★ ║  STARS
  ╚═══╝`,
      },
    ],
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
