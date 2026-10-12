import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getOrdersAdmin } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await getOrdersAdmin(200);
    return NextResponse.json({ items });
  } catch (e) {
    return dbError(e);
  }
}
