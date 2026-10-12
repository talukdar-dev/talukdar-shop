import { getRelated } from '@/lib/db';
import type { Product } from '@/lib/types';
import SectionBlock from './SectionBlock';

export default async function RelatedProducts({ product }: { product: Product }) {
  const items = await getRelated(product, 10);
  if (items.length === 0) return null;
  return (
    <SectionBlock
      title="Related Products"
      href={product.category ? `/category/${product.category.slug}` : '/'}
      products={items}
    />
  );
}
