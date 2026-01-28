'use client';

import React from 'react';

const socialLinks = [
  {
    name: 'X',
    url: 'https://x.com/JupiterTheWL',
    icon: 'https://api.iconify.design/simple-icons/x.svg?color=%23888888',
    width: 32,
    height: 32,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/JupiterTheWarlock',
    icon: 'https://api.iconify.design/simple-icons/github.svg?color=%23888888',
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
          <img
            src={link.icon}
            alt={link.name}
            width={link.width}
            height={link.height}
            className="hover:shadow-[0_0_10px_currentColor] transition-shadow"
          />
        </a>
      ))}
    </div>
  );
}
