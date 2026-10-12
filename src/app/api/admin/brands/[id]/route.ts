import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { upsertBrand, deleteBrand } from '@/lib/admin-db';


type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await upsertBrand({ ...body, id });
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
