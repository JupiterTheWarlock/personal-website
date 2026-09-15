'use client';

const socialLinks = [
  { name: 'X', url: 'https://x.com/JupiterTheWL' },
  { name: 'GitHub', url: 'https://github.com/JupiterTheWarlock' },
  { name: 'itch.io', url: 'https://jupiter-the-warlock.itch.io/' },
  { name: 'MakerWorld', url: 'https://makerworld.com.cn/zh/@JtheWL' },
  { name: 'Bilibili', url: 'https://space.bilibili.com/76543088' },
  { name: 'Zhihu', url: 'https://www.zhihu.com/people/ying-ying-ying-ying-ying-hua-san-27' },
  { name: 'Gcores', url: 'https://www.gcores.com/users/744716' },
];

export default function SocialLinks() {
  return (
    <div className="social-links">
      {socialLinks.map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link">
          {link.name} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
