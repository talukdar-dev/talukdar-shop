import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog — Buying Guides & Tips | Talukdar Shop',
  description:
    'Home appliance buying guides, price comparisons, recipes and maintenance tips for Bangladeshi homes. Expert advice from Talukdar Shop.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Talukdar Shop Blog — Buying Guides & Tips',
    url: `${siteUrl}/blog`,
    description:
      'Home appliance buying guides, price comparisons, recipes and maintenance tips for Bangladeshi homes.',
    blogPost: BLOG_POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      image: post.heroImage,
      datePublished: post.date,
      author: { '@type': 'Organization', name: 'Talukdar Shop' },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1a1a1a] mt-2">
        Buying Guides & Tips
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-5">
        Expert guides on home appliances in Bangladesh — prices, comparisons, recipes and care tips.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="bg-white rounded-md border border-[#e8e8e8] overflow-hidden hover:shadow-md transition-shadow group"
          >
            <div className="aspect-[16/9] overflow-hidden bg-gray-100">
              <img
                src={post.heroImage}
                alt={post.heroAlt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand mb-1">
                {post.category}
              </p>
              <h2 className="text-[15px] font-bold text-[#222] leading-snug group-hover:text-brand transition-colors">
                {post.title}
              </h2>
              <p className="text-[12.5px] text-ink mt-1.5 line-clamp-2">{post.excerpt}</p>
              <p className="text-[11.5px] text-gray-500 mt-2">
                {post.date} · {post.readMinutes} min read
              </p>
            </div>
          </Link>
        ))}
      </div>

      {BLOG_POSTS.length === 0 && (
        <p className="text-ink text-[14px]">Blog posts coming soon.</p>
      )}
    </>
  );
}
