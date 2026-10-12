import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { NOT_CONFIGURED } from '@/lib/admin-db';

export async function requireAdmin(): Promise<NextResponse | null> {
  const ok = await isAdminRequest();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export function dbError(e: unknown): NextResponse {
  const msg = e instanceof Error ? e.message : 'Unknown error';
  const demo = msg === NOT_CONFIGURED;
  return NextResponse.json({ error: msg, demo }, { status: demo ? 503 : 500 });
}
