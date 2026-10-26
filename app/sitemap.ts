import type { MetadataRoute } from 'next';
import { locales } from '@/app/i18n/config';
import { languageAlternates, siteUrl } from '@/app/i18n/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return [...[''].flatMap(path => locales.map((locale) => ({
    url: `${siteUrl}/${locale}/${path}`,
    alternates: { languages: languageAlternates(path) },
  })))];
}
