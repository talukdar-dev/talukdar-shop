import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, dbError } from '../../_guard';
import { getProductAdmin, upsertProduct, deleteProduct } from '@/lib/admin-db';


type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const item = await getProductAdmin(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await upsertProduct({ ...body, id });
    // On-demand revalidation: refresh static pages
    revalidatePath(`/product/${item.slug}`);
    revalidatePath('/');
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
    const existing = await getProductAdmin(id);
    await deleteProduct(id);
    // On-demand revalidation: refresh static pages
    if (existing?.slug) revalidatePath(`/product/${existing.slug}`);
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
