import React from 'react';
import Header from '@/components/layout/Header';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen flex flex-col relative z-10">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
