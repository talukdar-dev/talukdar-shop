/** Blog post type for Talukdar Shop buying guides & tips. */
export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Category label shown on cards */
  category: string;
  /** Related shop category slug for internal linking */
  shopCategory: string;
  /** ISO date */
  date: string;
  readMinutes: number;
  heroImage: string;
  heroAlt: string;
  /** Short excerpt for cards & meta */
  excerpt: string;
  /** Full HTML content */
  content: string;
  /** FAQ for AEO/GEO schema */
  faqs: { q: string; a: string }[];
  /** Wikipedia/external reference */
  externalLink: { title: string; url: string };
  tags: string[];
}

import { BLOG_POSTS_1 } from './blog-posts-1';
import { BLOG_POSTS_2 } from './blog-posts-2';
import { BLOG_POSTS_3 } from './blog-posts-3';
import { BLOG_POSTS_4 } from './blog-posts-4';

export const BLOG_POSTS: BlogPost[] = [
  ...BLOG_POSTS_1,
  ...BLOG_POSTS_2,
  ...BLOG_POSTS_3,
  ...BLOG_POSTS_4,
];
