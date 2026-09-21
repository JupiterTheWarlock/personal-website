import React from 'react';
import Header from '@/components/layout/Header';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/app/i18n/config';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(params.locale as Locale)) notFound();

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
