import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../_guard';
import { supabaseAdmin } from '@/lib/admin-db';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from('settings')
      .select('key,value')
      .like('key', 'wa_chatlog_%')
      .order('key');
    const chats = (data ?? []).map((r: { key: string; value: unknown }) => {
      const v = r.value as { messages?: Array<{ d: string; t: string; at: number }> } | undefined;
      const msgs = v?.messages ?? [];
      const last = msgs[msgs.length - 1];
      return {
        phone: r.key.replace('wa_chatlog_', ''),
        count: msgs.length,
        lastText: last?.t?.slice(0, 80) ?? '',
        lastAt: last?.at ?? 0,
        lastDir: last?.d ?? '',
      };
    }).sort((a, b) => b.lastAt - a.lastAt);
    return NextResponse.json({ chats });
  } catch (e) {
    return dbError(e);
  }
}
