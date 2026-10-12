// Next.js 16 Proxy (replaces middleware.ts) — admin auth guard.
// Self-contained token check (no shared imports) so it stays edge-safe.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'ts_admin';

function verifyToken(token: string): boolean {
  try {
    const secret =
      process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-me-in-production';
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = createHmac('sha256', secret).update(payload).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length) return false;
    if (!timingSafeEqual(given, expected)) return false;
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public: login page + login/logout endpoints
  if (
    pathname === '/admin/login' ||
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/logout'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  const ok = !!token && verifyToken(token);

  if (!ok) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
