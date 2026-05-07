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
    projects_title: '项目',
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
    projects: [
      {
        name: '矩形之巢+分形之巢+矩形之墓+茧+天空匣',
        url: 'https://jupiter-the-warlock.itch.io/nest-of-rectangles',
        cover: 'https://img.itch.zone/aW1nLzIwNDMwNDkyLnBuZw==/original/jy5pVb.png',
      },
      {
        name: '野食狂想曲 YeShit Rhapsody',
        url: 'https://jupiter-the-warlock.itch.io/yeshit-rhapsody',
        cover: 'https://img.itch.zone/aW1nLzE3MTI2NTQ1LnBuZw==/original/fos7%2FL.png',
      },
      {
        name: '咸鱼不想死 The Reluctant Salted Fish',
        url: 'https://jupiter-the-warlock.itch.io/the-reluctant-salted-fish',
        cover: 'https://img.itch.zone/aW1nLzE0OTM5ODkyLnBuZw==/original/kNZy2N.png',
      },
      {
        name: 'Single-vector Strike',
        url: 'https://jupiter-the-warlock.itch.io/single-vector-strike',
        cover: 'https://img.itch.zone/aW1nLzIwMTgxMjU3LnBuZw==/original/pMZsrs.png',
      },
      {
        name: '石油之王',
        url: 'https://jupiter-the-warlock.itch.io/kingofpetroleum',
        cover: 'https://img.itch.zone/aW1nLzE5NDYxMjMwLnBuZw==/original/BdTW1G.png',
      },
      {
        name: '诸天尽头的垃圾场',
        url: 'https://jupiter-the-warlock.itch.io/thejunkyardoftheend',
        cover: 'https://img.itch.zone/aW1nLzE5MjYzNDU2LnBuZw==/original/xxFdsS.png',
      }
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
    projects_title: 'Projects',
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
    projects: [
      {
        name: 'Nest of Rectangles',
        url: 'https://jupiter-the-warlock.itch.io/nest-of-rectangles',
        cover: 'https://img.itch.zone/aW1nLzIwNDMwNDkyLnBuZw==/original/jy5pVb.png',
      },
      {
        name: 'Single-vector Strike',
        url: 'https://jupiter-the-warlock.itch.io/single-vector-strike',
        cover: 'https://img.itch.zone/aW1nLzIwMTgxMjU3LnBuZw==/original/pMZsrs.png',
      },
      {
        name: 'King of Petroleum',
        url: 'https://jupiter-the-warlock.itch.io/kingofpetroleum',
        cover: 'https://img.itch.zone/aW1nLzE5NDYxMjMwLnBuZw==/original/BdTW1G.png',
      },
      {
        name: 'The Junkyard of the End',
        url: 'https://jupiter-the-warlock.itch.io/thejunkyardoftheend',
        cover: 'https://img.itch.zone/aW1nLzE5MjYzNDU2LnBuZw==/original/xxFdsS.png',
      },
      {
        name: 'YeShit Rhapsody',
        url: 'https://jupiter-the-warlock.itch.io/yeshit-rhapsody',
        cover: 'https://img.itch.zone/aW1nLzE3MTI2NTQ1LnBuZw==/original/fos7%2FL.png',
      },
      {
        name: 'The Reluctant Salted Fish',
        url: 'https://jupiter-the-warlock.itch.io/the-reluctant-salted-fish',
        cover: 'https://img.itch.zone/aW1nLzE0OTM5ODkyLnBuZw==/original/kNZy2N.png',
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
