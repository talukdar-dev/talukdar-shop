import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/db';
import type { Order } from '@/lib/types';

const METHODS: Order['payment_method'][] = ['cod', 'bkash', 'nagad', 'rocket', 'card', 'emi'];

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const customer_name = String(body.customer_name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const address = String(body.address ?? '').trim();
  const city = String(body.city ?? '').trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const payment_method = String(body.payment_method ?? '');

  if (!customer_name || !address || !city) {
    return NextResponse.json(
      { message: 'Name, address and city are required.' },
      { status: 400 },
    );
  }
  if (!/^01[0-9]{9}$/.test(phone)) {
    return NextResponse.json({ message: 'Enter a valid 11-digit mobile number.' }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ message: 'Order must contain at least one item.' }, { status: 400 });
  }
  if (!METHODS.includes(payment_method as Order['payment_method'])) {
    return NextResponse.json({ message: 'Invalid payment method.' }, { status: 400 });
  }

  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  try {
    const order = await createOrder({
      customer_name,
      phone,
      email: typeof body.email === 'string' ? body.email : undefined,
      address,
      city,
      area: typeof body.area === 'string' ? body.area : undefined,
      items: items.map((i: Record<string, unknown>) => ({
        product_id: String(i.product_id ?? ''),
        name: String(i.name ?? ''),
        price: num(i.price),
        qty: Math.max(1, Math.floor(num(i.qty)) || 1),
        image: typeof i.image === 'string' ? i.image : undefined,
      })),
      subtotal: num(body.subtotal),
      shipping: num(body.shipping),
      discount: num(body.discount),
      total: num(body.total),
      payment_method: payment_method as Order['payment_method'],
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });
    return NextResponse.json({ order_no: order.order_no }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not create order.' },
      { status: 500 },
    );
  }
}
