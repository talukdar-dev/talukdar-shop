import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getBannersAdmin, upsertBanner } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await getBannersAdmin();
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
    if (!body?.title || !body?.image) {
      return NextResponse.json(
        { error: 'title and image are required' },
        { status: 400 },
      );
    }
    const item = await upsertBanner(body);
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}
