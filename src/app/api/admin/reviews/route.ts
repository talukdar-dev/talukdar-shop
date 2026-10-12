import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getReviewsAdmin } from '@/lib/admin-db';

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id') ?? undefined;
    const items = await getReviewsAdmin(productId);
    return NextResponse.json({ items });
  } catch (e) {
    return dbError(e);
  }
}
