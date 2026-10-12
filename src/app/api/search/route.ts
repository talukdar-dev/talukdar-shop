import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';
import { effectivePrice } from '@/lib/format';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);
  const { items } = await getProducts({ q, perPage: 8 });
  return NextResponse.json(
    items.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: effectivePrice(p),
      image: p.images[0] ?? '',
      brand: p.brand?.name ?? '',
    })),
  );
}
