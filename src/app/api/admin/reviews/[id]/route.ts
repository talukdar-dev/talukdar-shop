import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { updateReview, deleteReview } from '@/lib/admin-db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ['customer_name', 'review_text', 'rating', 'review_date', 'is_approved'] as const;
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    await updateReview(id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
