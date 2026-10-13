import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '@/lib/blog';
import Breadcrumb from '@/components/store/Breadcrumb';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: 'Post not found | Talukdar Shop' };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `${siteUrl}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.heroImage],
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.heroImage,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Talukdar Shop', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'Talukdar Shop', url: siteUrl },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  // HowTo schema for the cleaning/maintenance guide (Google rich results)
  const isHowTo = post.slug === 'how-to-clean-maintain-air-fryer';
  const howToJsonLd = isHowTo
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.metaDescription,
        image: post.heroImage,
        totalTime: 'PT30M',
        step: [
          {
            '@type': 'HowToStep',
            name: 'Unplug and cool down',
            text: 'Unplug the air fryer and let it cool completely before cleaning.',
          },
          {
            '@type': 'HowToStep',
            name: 'Remove the basket and pan',
            text: 'Take out the basket and pan. Soak in warm soapy water for 10 minutes.',
          },
          {
            '@type': 'HowToStep',
            name: 'Clean the basket',
            text: 'Scrub gently with a soft sponge. Avoid steel wool to protect the non-stick coating.',
          },
          {
            '@type': 'HowToStep',
            name: 'Wipe the interior',
            text: 'Wipe inside the air fryer with a damp cloth. Clean the heating element carefully.',
          },
          {
            '@type': 'HowToStep',
            name: 'Dry and reassemble',
            text: 'Dry all parts completely before reassembling to prevent odors.',
          },
        ],
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

      <Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />

      <article className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-8 mt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand mb-2">
          {post.category}
        </p>
        <h1 className="text-[22px] sm:text-[30px] font-bold text-[#1a1a1a] leading-tight">
          {post.title}
        </h1>
        <p className="text-[12.5px] text-gray-500 mt-2 mb-5">
          {post.date} · {post.readMinutes} min read · By Talukdar Shop
        </p>

        <div className="rounded-md overflow-hidden mb-6">
          <img
            src={post.heroImage}
            alt={post.heroAlt}
            className="w-full h-auto"
          />
        </div>

        <div
          className="blog-content text-[14.5px] text-gray-800 leading-[1.85] space-y-4
            [&>h2]:text-[20px] [&>h2]:font-bold [&>h2]:text-[#1a1a1a] [&>h2]:mt-8 [&>h2]:mb-2
            [&>h3]:text-[17px] [&>h3]:font-bold [&>h3]:text-[#222] [&>h3]:mt-6
            [&>p>a]:text-link [&>p>a]:hover:underline
            [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1.5
            [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:space-y-1.5
            [&>table]:w-full [&>table]:text-[13px] [&>table]:border-collapse
            [&>table_th]:bg-gray-100 [&>table_th]:font-bold [&>table_th]:p-2 [&>table_th]:border [&>table_th]:border-gray-200 [&>table_th]:text-left
            [&>table_td]:p-2 [&>table_td]:border [&>table_td]:border-gray-200
            [&>blockquote]:border-l-4 [&>blockquote]:border-brand [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-ink"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA to shop */}
        <div className="mt-8 bg-navy text-white rounded-md p-5 text-center">
          <p className="font-bold text-[16px] mb-1">Ready to shop?</p>
          <p className="text-[13px] text-white/70 mb-3">
            Browse genuine products at the best prices in Bangladesh.
          </p>
          <Link
            href={`/category/${post.shopCategory}`}
            className="inline-block bg-brand hover:bg-brand-dark text-white font-bold text-[14px] px-6 py-2.5 rounded-md transition-colors"
          >
            Shop {post.category}
          </Link>
        </div>

        {/* FAQ for AEO/GEO */}
        {post.faqs.length > 0 && (
          <section className="mt-8" aria-label="Frequently asked questions">
            <h2 className="text-[19px] font-bold text-[#1a1a1a] mb-3">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2.5">
              {post.faqs.map((f, i) => (
                <details
                  key={i}
                  className="border border-[#e8e8e8] rounded-md px-4 py-3 group"
                >
                  <summary className="font-semibold text-[14px] cursor-pointer list-none flex justify-between items-center">
                    {f.q}
                    <span className="text-brand text-[18px] group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-[13.5px] text-gray-700 mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* external reference */}
        <p className="mt-6 text-[12.5px] text-ink">
          Reference:{' '}
          <a
            href={post.externalLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            {post.externalLink.title} on Wikipedia
          </a>
        </p>

        {/* tags */}
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="text-[11.5px] bg-gray-100 text-gray-600 rounded-full px-3 py-1"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* related posts — internal linking */}
      {related.length > 0 && (
        <section className="mt-6" aria-label="Related articles">
          <h2 className="text-[17px] font-bold text-[#222] mb-3">Related Articles</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="bg-white rounded-md border border-[#e8e8e8] overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                  <img
                    src={r.heroImage}
                    alt={r.heroAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-[13.5px] font-bold leading-snug group-hover:text-brand transition-colors">
                    {r.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
