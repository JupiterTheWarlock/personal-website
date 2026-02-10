import React from 'react';
import { locales } from '@/app/i18n/config';
import dynamic from 'next/dynamic';

// 动态导入以禁用 SSR
const AnimationsShowcase = dynamic(
  () => import('@/components/content/AnimationsShowcase'),
  { ssr: false }
);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const translations = {
  'zh-CN': {
    title: 'ASCII 动画展示',
    subtitle: '使用 p5.js 和创意编程',
    description: '这里展示了一些基于 p5.js 的抽象几何动画，通过 Canvas 渲染后转换为 ASCII 字符显示。',
    examples: {
      rotating: '旋转正方形',
      wave: '波浪粒子',
      fractal: '分形树',
    },
    back: '返回首页',
  },
  'en-US': {
    title: 'ASCII Animation Showcase',
    subtitle: 'Powered by p5.js & Creative Coding',
    description: 'A showcase of abstract geometric animations created with p5.js, rendered as ASCII art.',
    examples: {
      rotating: 'Rotating Square',
      wave: 'Wave Particles',
      fractal: 'Fractal Tree',
    },
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

  return <AnimationsShowcase translations={t} locale={locale} />;
}
