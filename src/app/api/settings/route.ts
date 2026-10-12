import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    site_name: s.site_name,
    hotline: s.hotline,
    hotline_hours: s.hotline_hours,
    inside_dhaka_shipping: s.inside_dhaka_shipping,
    outside_dhaka_shipping: s.outside_dhaka_shipping,
    free_shipping_over: s.free_shipping_over ?? null,
    payment_cod_enabled: s.payment_cod_enabled,
    payment_bkash_enabled: s.payment_bkash_enabled,
    payment_bkash_number: s.payment_bkash_number,
    payment_nagad_enabled: s.payment_nagad_enabled,
    payment_nagad_number: s.payment_nagad_number,
    payment_rocket_enabled: s.payment_rocket_enabled,
    payment_rocket_number: s.payment_rocket_number,
    payment_merchant_enabled: s.payment_merchant_enabled,
    payment_merchant_provider: s.payment_merchant_provider,
  });
}
