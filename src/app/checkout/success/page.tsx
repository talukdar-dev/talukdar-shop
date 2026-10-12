import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { IconCheck } from '@/components/store/icons';

export const metadata: Metadata = {
  title: 'Order Placed',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Order-specific page: always rendered dynamically per request.
export const instant = false;

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const raw = sp.order_no;
  const orderNo = Array.isArray(raw) ? raw[0] : raw;

  return (
    <div className="bg-white rounded-md border border-[#e8e8e8] p-8 sm:p-12 text-center max-w-xl mx-auto">
      <span className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
        <IconCheck className="w-8 h-8" />
      </span>
      <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-2">Order placed successfully!</h1>
      <p className="text-[13.5px] text-ink leading-relaxed mb-4">
        Thank you for shopping with Talukdar Shop. Our team will call you shortly to confirm
        your order.
      </p>
      {orderNo && (
        <p className="inline-block bg-gray-50 border border-gray-200 rounded-md px-5 py-2.5 text-[14px] mb-6">
          Order No: <span className="font-black text-brand">{orderNo}</span>
        </p>
      )}
      <div>
        <Link
          href="/"
          className="inline-block px-8 h-11 leading-[44px] bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
