import type { MetadataRoute } from 'next';
import { locales } from '@/app/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `https://www.jthewl.cc/${locale}/`,
  }));
}
