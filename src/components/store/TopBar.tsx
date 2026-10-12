'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import {
  IconCart,
  IconChevronDown,
  IconChip,
  IconCompare,
  IconFlash,
  IconGift,
  IconUser,
} from './icons';

export default function TopBar() {
  const { count, compareList, mounted } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0];

  const doLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="bg-navy text-white text-[12px]">
      <div className="max-w-[1280px] mx-auto px-3 flex items-center justify-between h-9">
        <nav className="flex items-center gap-3 sm:gap-5" aria-label="Utility">
          <Link href="/offers" className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <IconGift className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Offers</span>
            <span className="hidden md:inline text-white/60">Latest Offers</span>
          </Link>
          <Link href="/offers" className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <IconFlash className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Flash Deals</span>
            <span className="hidden md:inline text-white/60">Special Deals</span>
          </Link>
          <Link href="/pc-builder" className="hidden sm:flex items-center gap-1.5 hover:text-brand-orange transition-colors">
            <IconChip className="w-4 h-4 shrink-0" />
            <span className="font-semibold">PC Builder</span>
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
              <IconCompare className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                Compare{mounted ? ` (${compareList.length})` : ''}
              </span>
            </button>
            <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
              <div className="bg-white text-gray-800 shadow-xl rounded-md w-64 py-2 border border-gray-100">
                {compareList.length === 0 ? (
                  <p className="px-4 py-2 text-gray-500">No products to compare.</p>
                ) : (
                  compareList.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="block px-4 py-1.5 hover:bg-gray-50 text-[13px] truncate"
                    >
                      {p.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-brand-orange transition-colors">
              <IconUser className="w-4 h-4 shrink-0" />
              <span className="font-semibold hidden sm:inline">
                {mounted && user ? firstName : 'Account'}
              </span>
              <IconChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
              <div className="bg-white text-gray-800 shadow-xl rounded-md w-40 py-2 border border-gray-100">
                {mounted && user ? (
                  <>
                    <Link href="/account" className="block px-4 py-2 hover:bg-gray-50 text-[13px]">
                      My Account
                    </Link>
                    <button
                      onClick={doLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px]"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/account/register" className="block px-4 py-2 hover:bg-gray-50 text-[13px]">
                      Register
                    </Link>
                    <Link href="/account/login" className="block px-4 py-2 hover:bg-gray-50 text-[13px]">
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <Link href="/cart" className="relative flex items-center hover:text-brand-orange transition-colors" aria-label="Cart">
            <IconCart className="w-5 h-5" />
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
