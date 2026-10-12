import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { getOrderAdmin, updateOrderStatusAdmin } from '@/lib/admin-db';
import type { OrderStatus } from '@/lib/types';


type Ctx = { params: Promise<{ id: string }> };

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const item = await getOrderAdmin(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    return dbError(e);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status?: OrderStatus };
    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    await updateOrderStatusAdmin(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
