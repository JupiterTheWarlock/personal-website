import { Metadata } from 'next';
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
      <body className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)]">
        {children}
        <div className="crt-overlay fixed inset-0 pointer-events-none z-50" />
      </body>
    </html>
  );
}
