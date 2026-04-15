import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AsciiBackground from '@/components/three/AsciiBackground';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AsciiBackground />
      <div className="min-h-screen flex flex-col relative z-10">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
