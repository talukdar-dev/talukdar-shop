import { Suspense } from 'react';
import OrderDetail from '@/components/admin/OrderDetail';
import { Spinner } from '@/components/admin/UI';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <OrderDetail id={id} />
    </Suspense>
  );
}
