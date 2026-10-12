import { Suspense } from 'react';
import ProductEdit from '@/components/admin/ProductEdit';
import { Spinner } from '@/components/admin/UI';

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProductEdit id={id} />
    </Suspense>
  );
}
