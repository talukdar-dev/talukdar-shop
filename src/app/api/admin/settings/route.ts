import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { getSettings } from '@/lib/db';
import { saveSettings, isDbConfigured } from '@/lib/admin-db';


export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings, dbConfigured: isDbConfigured() });
  } catch (e) {
    return dbError(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    await saveSettings(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
