import Link from 'next/link';
import type { Product } from '@/lib/types';
import ProductCarousel from './ProductCarousel';
import { IconArrowRight } from './icons';

interface Props {
  id?: string;
  title: string;
  href: string;
  linkText?: string;
  products: Product[];
  minItems?: number;
}

/** Titled product carousel with "View All →" link. */
export default function SectionBlock({ id, title, href, linkText = 'View All', products, minItems = 1 }: Props) {
  if (products.length < minItems) return null;
  return (
    <section id={id} className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4 scroll-mt-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] sm:text-[19px] font-bold text-[#222] border-l-4 border-brand pl-2.5">
          {title}
        </h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-[13px] font-semibold text-link hover:underline shrink-0"
        >
          {linkText} <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <ProductCarousel products={products} href={href} linkText={linkText} />
    </section>
  );
}
