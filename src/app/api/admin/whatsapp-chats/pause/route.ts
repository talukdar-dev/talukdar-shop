import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { supabaseAdmin } from '@/lib/admin-db';

// POST { phone, paused: true } → pause AI for 5 min (auto-resume)
// POST { phone, paused: false } → resume immediately
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const phone = String(body.phone ?? '').trim();
    const paused = body.paused === true;
    if (!phone) return NextResponse.json({ ok: false }, { status: 400 });
    const sb = supabaseAdmin();
    const key = `wa_paused_${phone}`;
    if (paused) {
      await sb.from('settings').upsert({ key, value: { at: Date.now() } }, { onConflict: 'key' });
    } else {
      await sb.from('settings').delete().eq('key', key);
    }
    return NextResponse.json({ ok: true, paused });
  } catch (e) {
    return dbError(e);
  }
}

// GET ?phone=... → { paused: true/false }
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') ?? '';
    if (!phone) return NextResponse.json({ paused: false });
    const sb = supabaseAdmin();
    const { data } = await sb.from('settings').select('value').eq('key', `wa_paused_${phone}`).maybeSingle();
    const at = (data?.value as { at?: number } | undefined)?.at ?? 0;
    const paused = at > 0 && Date.now() - at < 5 * 60_000;
    return NextResponse.json({ paused });
  } catch (e) {
    return dbError(e);
  }
}
