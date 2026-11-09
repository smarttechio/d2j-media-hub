import type { MetadataRoute } from 'next';
import {
  getPublishedArticles,
  getPublishedOpportunities,
  getPublishedScholarAnswers,
  getCategories,
} from '@/lib/db';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dpathtojannah.com').replace(/\/+$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
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
    lastModified: new Date('2026-10-26'),
    changeFrequency: route === '' || route === '/news' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  for (const cat of getCategories()) {
    entries.push({
      url: `${BASE_URL}/news/${cat.slug}`,
      lastModified: new Date('2026-10-26'),
      changeFrequency: 'daily',
      priority: 0.75,
    });
  }

  for (const art of getPublishedArticles()) {
    entries.push({
      url: `${BASE_URL}/news/${art.category}/${art.slug}`,
      lastModified: new Date(art.updatedAt || art.publishedAt || '2026-10-26'),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const opp of getPublishedOpportunities()) {
    entries.push({
      url: `${BASE_URL}/opportunities/${opp.slug}`,
      lastModified: new Date(opp.lastVerified || '2026-10-26'),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const qa of getPublishedScholarAnswers()) {
    entries.push({
      url: `${BASE_URL}/ask-a-scholar/answers/${qa.slug}`,
      lastModified: new Date(qa.publishedAt || '2026-10-26'),
      changeFrequency: 'monthly',
      priority: 0.65,
    });
  }

  return entries;
}
