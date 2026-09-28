import type { MetadataRoute } from 'next';
import { locales } from '@/app/i18n/config';
import { languageAlternates, siteUrl } from '@/app/i18n/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}/`,
    alternates: { languages: languageAlternates() },
  }));
}
