'use client';

import React from 'react';

const socialLinks = [
  {
    name: 'X',
    url: 'https://x.com/JupiterTheWL',
    icon: 'https://api.iconify.design/simple-icons/x.svg?color=%23DA7756',
    width: 32,
    height: 32,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/JupiterTheWarlock',
    icon: 'https://api.iconify.design/simple-icons/github.svg?color=%23DA7756',
    width: 32,
    height: 32,
  },
  {
    name: 'itch.io',
    url: 'https://jupiter-the-warlock.itch.io/',
    icon: 'https://api.iconify.design/simple-icons/itchdotio.svg?color=%23FA5C5C',
    width: 32,
    height: 32,
  },
  {
    name: 'Makerworld',
    url: 'https://makerworld.com.cn/zh/@JtheWL',
    icon: 'https://api.iconify.design/simple-icons/bambulab.svg?color=%2300AE42',
    width: 32,
    height: 32,
  },
  {
    name: 'Bilibili',
    url: 'https://space.bilibili.com/76543088',
    icon: 'https://api.iconify.design/simple-icons/bilibili.svg?color=%2300A1D6',
    width: 32,
    height: 32,
  },
  {
    name: 'Zhihu',
    url: 'https://www.zhihu.com/people/ying-ying-ying-ying-ying-hua-san-27',
    icon: 'https://api.iconify.design/simple-icons/zhihu.svg?color=%230066FF',
    width: 32,
    height: 32,
  },
  {
    name: 'Gcores',
    url: 'https://www.gcores.com/users/744716',
    icon: 'https://www.gcores.com/favicon.ico',
    width: 32,
    height: 32,
  },
];

export default function SocialLinks() {
  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {socialLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title={link.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={link.icon}
            alt={link.name}
            width={link.width}
            height={link.height}
            className="hover:drop-shadow-[0_0_8px_rgba(218,119,86,0.6)] transition-all"
          />
        </a>
      ))}
    </div>
  );
}
