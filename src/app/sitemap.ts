import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/db';
import { BLOG_POSTS } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: products }, categories] = await Promise.all([
    getProducts({ perPage: 1000 }),
    getCategories(),
  ]);

  const staticPages = [
    '',
    '/offers',
    '/pc-builder',
    '/emi',
    '/blog',
  ];

  return [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}${p || '/'}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: p === '' ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...BLOG_POSTS.map((b) => ({
      url: `${SITE_URL}/blog/${b.slug}`,
      lastModified: new Date(b.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
