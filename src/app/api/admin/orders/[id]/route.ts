import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { getOrderAdmin, updateOrderStatusAdmin } from '@/lib/admin-db';
import type { OrderStatus } from '@/lib/types';
import { orderConfirmedEmail, orderCancelledEmail, sendEmail } from '@/lib/email';
import { generateInvoicePdf } from '@/lib/invoice';


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
    const body = (await req.json()) as { status?: OrderStatus; payment_status?: 'paid' | 'unpaid' };
    if (body.payment_status === 'paid' || body.payment_status === 'unpaid') {
      const { updatePaymentStatusAdmin } = await import('@/lib/admin-db');
      await updatePaymentStatusAdmin(id, body.payment_status);
      return NextResponse.json({ ok: true });
    }
    const { status } = body;
    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    await updateOrderStatusAdmin(id, status);
    // notify customer on confirm / cancel (fire-and-forget)
    if (status === 'confirmed' || status === 'cancelled') {
      notifyStatusChange(id, status).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

async function notifyStatusChange(id: string, status: 'confirmed' | 'cancelled') {
  const order = await getOrderAdmin(id);
  if (!order?.email) return;
  try {
    if (status === 'confirmed') {
      const { subject, html } = orderConfirmedEmail(order);
      const pdf = await generateInvoicePdf(order);
      await sendEmail({
        to: order.email,
        subject,
        html,
        attachments: [
          { filename: `Invoice-${order.order_no}.pdf`, content: pdf, contentType: 'application/pdf' },
        ],
      });
    } else {
      const { subject, html } = orderCancelledEmail(order);
      await sendEmail({ to: order.email, subject, html });
    }
  } catch (err) {
    console.error('[order] status-email failed:', err instanceof Error ? err.message : err);
  }
}
