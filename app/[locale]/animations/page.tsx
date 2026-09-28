import React from 'react';
import { isLocale } from '@/app/i18n/config';
import { getMessages } from '@/app/i18n/messages';
import { localizedMetadata } from '@/app/i18n/metadata';
import { notFound } from 'next/navigation';

export function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return localizedMetadata(params.locale, 'animations/');
}

export default function AnimationsPage({
  params
}: {
  params: { locale: string };
}) {
  const t = getMessages(params.locale).animations;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-xl text-gray-400">{t.comingSoon}</p>
    </div>
  );
}
