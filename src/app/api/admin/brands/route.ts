import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getBrandsAdmin, upsertBrand } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await getBrandsAdmin();
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
    if (!body?.name || !body?.slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 },
      );
    }
    const item = await upsertBrand(body);
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}
