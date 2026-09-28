import React from 'react';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import JunkyardLegacyBackground from '@/components/content/JunkyardLegacyBackground';
import { notFound } from 'next/navigation';
import { locales, isLocale } from '@/app/i18n/config';
import { getMessages } from '@/app/i18n/messages';
import { localizedMetadata } from '@/app/i18n/metadata';
import '@/public/junkyard-scene/brand.css';
import '@/app/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return localizedMetadata(params.locale);
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const messages = getMessages(params.locale);

  return (
    <html lang={params.locale}>
      <body className="min-h-screen text-[var(--text-primary)]">
        <JunkyardLegacyBackground />
        <div className="min-h-screen flex flex-col relative z-10">
          <Header locale={params.locale} nav={messages.nav} languageLabel={messages.language} />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Script src="/junkyard-scene/host.js" data-brand-profile="home" strategy="afterInteractive" />
      </body>
    </html>
  );
}
