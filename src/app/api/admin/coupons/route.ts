import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getCouponsAdmin, upsertCoupon } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await getCouponsAdmin();
    return NextResponse.json({ items });
  } catch (e) {
    return dbError(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body?.code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }
    const item = await upsertCoupon(body);
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}
