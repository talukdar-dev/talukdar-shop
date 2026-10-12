// Admin auth — HMAC-signed session tokens + cookie helpers.
// Token format: base64url(JSON {exp, r}) . base64url(HMAC_SHA256(payload, secret))

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'ts_admin';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-me-in-production'
  );
}

function b64urlEncode(s: string | Buffer): string {
  return Buffer.from(s).toString('base64url');
}

function b64urlDecode(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8');
}

export function signToken(): string {
  const payload = b64urlEncode(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, r: randomBytes(8).toString('hex') }),
  );
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): boolean {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length) return false;
    if (!timingSafeEqual(given, expected)) return false;
    const data = JSON.parse(b64urlDecode(payload)) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

/** Throws if ADMIN_PASSWORD is not configured. Uses timing-safe compare. */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Add it to .env.local to enable admin login.',
    );
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, signToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return !!token && verifyToken(token);
}
