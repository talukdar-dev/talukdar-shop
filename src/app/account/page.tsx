'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { IconUser } from '@/components/store/icons';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { clear } = useCart();

  useEffect(() => {
    if (!loading && !user) router.replace('/account/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-md border border-[#e8e8e8] p-8 text-center text-[14px] text-ink">
          Loading…
        </div>
      </div>
    );
  }

  const doLogout = async () => {
    await logout();
    clear();
    router.push('/');
  };

  const initial = (user.displayName || user.email || 'T')[0]?.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-md border border-[#e8e8e8] p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <span className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[28px] font-bold">
              {initial}
            </span>
          )}
          <div>
            <h1 className="text-[20px] font-bold">{user.displayName || 'My Account'}</h1>
            <p className="text-[13px] text-ink">{user.email}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {user.providerData.some((p) => p.providerId === 'google.com')
                ? 'Signed in with Google'
                : 'Signed in with email'}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/cart"
            className="border border-gray-200 rounded-md p-4 hover:border-brand transition-colors"
          >
            <p className="font-bold text-[14px]">My Cart</p>
            <p className="text-[12.5px] text-ink">View items in your shopping cart</p>
          </Link>
          <Link
            href="/offers"
            className="border border-gray-200 rounded-md p-4 hover:border-brand transition-colors"
          >
            <p className="font-bold text-[14px]">Offers</p>
            <p className="text-[12.5px] text-ink">Check the latest deals and discounts</p>
          </Link>
          <Link
            href="/pc-builder"
            className="border border-gray-200 rounded-md p-4 hover:border-brand transition-colors"
          >
            <p className="font-bold text-[14px]">PC Builder</p>
            <p className="text-[12.5px] text-ink">Build your custom PC</p>
          </Link>
          <Link
            href="/emi"
            className="border border-gray-200 rounded-md p-4 hover:border-brand transition-colors"
          >
            <p className="font-bold text-[14px]">EMI Policy</p>
            <p className="text-[12.5px] text-ink">Installment plans and terms</p>
          </Link>
        </div>

        <button
          onClick={doLogout}
          className="mt-6 w-full sm:w-auto px-8 h-11 border border-gray-300 rounded-md text-[14px] font-bold text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
