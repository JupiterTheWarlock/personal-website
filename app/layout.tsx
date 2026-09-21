import { Metadata } from 'next';
import Script from 'next/script';
import JunkyardLegacyBackground from '@/components/content/JunkyardLegacyBackground';
import '@/public/junkyard-scene/brand.css';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Jupiter The Warlock - Personal Website',
  description: 'Indie Game Developer - Personal Website with ASCII art terminal style',
  icons: {
    icon: 'https://cfr2cdn.jthewl.cc/头像.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen text-[var(--text-primary)]">
        <JunkyardLegacyBackground />
        {children}
        <Script src="/junkyard-scene/host.js" data-brand-profile="home" strategy="afterInteractive" />
      </body>
    </html>
  );
}
