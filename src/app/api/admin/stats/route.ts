import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getStats } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const stats = await getStats();
    return NextResponse.json({ stats });
  } catch (e) {
    return dbError(e);
  }
}
