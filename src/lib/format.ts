export function taka(n: number): string {
  return n.toLocaleString('en-US') + '৳';
}

export function discountPct(price: number, old?: number | null): number | null {
  if (!old || old <= price) return null;
  return Math.round(((old - price) / old) * 100);
}

export function effectivePrice(p: {
  price: number;
  flash_price?: number | null;
  is_flash_deal?: boolean;
  flash_ends_at?: string | null;
}): number {
  if (
    p.is_flash_deal &&
    p.flash_price &&
    (!p.flash_ends_at || new Date(p.flash_ends_at) > new Date())
  ) {
    return p.flash_price;
  }
  return p.price;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function orderNo(): string {
  return 'TS-' + Date.now().toString().slice(-8);
}
