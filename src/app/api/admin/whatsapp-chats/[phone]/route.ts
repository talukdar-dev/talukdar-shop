import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { supabaseAdmin } from '@/lib/admin-db';

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) return NextResponse.json({ messages: [] });
    const sb = supabaseAdmin();
    const { data } = await sb
      .from('settings')
      .select('value')
      .eq('key', `wa_chatlog_${phone}`)
      .maybeSingle();
    const v = data?.value as { messages?: Array<{ d: string; t: string; at: number }> } | undefined;
    return NextResponse.json({ messages: v?.messages ?? [] });
  } catch (e) {
    return dbError(e);
  }
}
