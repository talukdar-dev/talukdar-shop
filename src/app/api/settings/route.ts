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
  });
}
