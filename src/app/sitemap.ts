import type { MetadataRoute } from 'next';
import {
  ensureDbSynced,
  getPublishedArticles,
  getPublishedOpportunities,
  getPublishedScholarAnswers,
  getCategories,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dpathtojannah.com').replace(
  /\/+$/,
  ''
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureDbSynced();

  const staticPages = [
    '',
    '/news',
    '/campus',
    '/islam',
    '/ask-a-scholar',
    '/ask-a-scholar/answers',
    '/education',
    '/opportunities',
    '/search',
    '/submit',
    '/guidelines',
    '/contact',
    '/about',
    '/editorial-policy',
    '/corrections-policy',
    '/privacy-policy',
    '/terms',
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/news' || route === '/campus' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  for (const cat of getCategories()) {
    entries.push({
      url: `${BASE_URL}/news/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.75,
    });
  }

  for (const art of getPublishedArticles()) {
    const modDate = art.updatedAt || art.publishedAt || '2026-11-19';
    entries.push({
      url: `${BASE_URL}/news/${art.category}/${art.slug}`,
      lastModified: new Date(modDate),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const opp of getPublishedOpportunities()) {
    entries.push({
      url: `${BASE_URL}/opportunities/${opp.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const qa of getPublishedScholarAnswers()) {
    entries.push({
      url: `${BASE_URL}/ask-a-scholar/answers/${qa.slug}`,
      lastModified: new Date(qa.publishedAt || '2026-11-19'),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
