import { NextRequest, NextResponse } from 'next/server';
import { getCoupon } from '@/lib/db';

/** Demo coupons used when no live coupon table is configured. */
const DEMO_COUPONS: Record<string, { type: 'percent' | 'flat'; value: number; min_order: number }> = {
  WELCOME10: { type: 'percent', value: 10, min_order: 5000 },
  FLAT500: { type: 'flat', value: 500, min_order: 10000 },
};

export async function POST(req: NextRequest) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 });
  }

  const code = String(body.code ?? '').trim().toUpperCase();
  const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0;
  if (!code) return NextResponse.json({ ok: false, message: 'Enter a coupon code.' });

  const live = await getCoupon(code);
  const coupon = live
    ? { type: live.type, value: live.value, min_order: live.min_order }
    : DEMO_COUPONS[code];

  if (!coupon) {
    return NextResponse.json({ ok: false, message: 'Invalid or expired coupon.' });
  }
  if (subtotal < coupon.min_order) {
    return NextResponse.json({
      ok: false,
      message: `This coupon needs a minimum order of ৳${coupon.min_order.toLocaleString('en-US')}.`,
    });
  }

  const discount =
    coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return NextResponse.json({ ok: true, code, discount });
}
