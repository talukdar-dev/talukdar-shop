import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getProductsAdmin, upsertProduct } from '@/lib/admin-db';


export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const items = await getProductsAdmin();
    const filtered = q
      ? items.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q),
        )
      : items;
    return NextResponse.json({ items: filtered, total: filtered.length });
  } catch (e) {
    return dbError(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body?.name || !body?.slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 },
      );
    }
    const product = await upsertProduct(body);
    return NextResponse.json({ item: product });
  } catch (e) {
    return dbError(e);
  }
}
