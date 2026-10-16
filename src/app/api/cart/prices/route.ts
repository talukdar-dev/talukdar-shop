import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { products as seedProducts } from '@/lib/seed';

/**
 * POST { ids: string[] } -> { prices: Record<id, { price, old_price, stock_qty, is_active, is_flash_deal, flash_price }> }
 * Lets the client-side cart refresh stale line-item prices against the live catalog.
 */
export async function POST(req: Request) {
  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((x: unknown) => typeof x === 'string').slice(0, 100);
    }
  } catch {
    /* ignore malformed body */
  }
  if (ids.length === 0) return NextResponse.json({ prices: {} });

  const prices: Record<
    string,
    {
      price: number;
      old_price: number | null;
      stock_qty: number;
      is_active: boolean;
      is_flash_deal: boolean;
      flash_price: number | null;
    }
  > = {};

  const sb = supabase();
  if (sb) {
    const { data } = await sb
      .from('products')
      .select('id,price,old_price,stock_qty,is_active,is_flash_deal,flash_price')
      .in('id', ids);
    for (const p of (data ?? []) as Array<{
      id: string; price: number; old_price: number | null; stock_qty: number;
      is_active: boolean; is_flash_deal: boolean; flash_price: number | null;
    }>) {
      prices[p.id] = {
        price: p.price,
        old_price: p.old_price ?? null,
        stock_qty: p.stock_qty,
        is_active: p.is_active,
        is_flash_deal: p.is_flash_deal,
        flash_price: p.flash_price ?? null,
      };
    }
  } else {
    for (const p of seedProducts) {
      if (!ids.includes(p.id)) continue;
      prices[p.id] = {
        price: p.price,
        old_price: p.old_price ?? null,
        stock_qty: p.stock_qty,
        is_active: p.is_active,
        is_flash_deal: p.is_flash_deal,
        flash_price: p.flash_price ?? null,
      };
    }
  }
  return NextResponse.json({ prices });
}
