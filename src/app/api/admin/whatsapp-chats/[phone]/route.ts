import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { supabaseAdmin } from '@/lib/admin-db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { phone } = await params;
    const decoded = decodeURIComponent(phone);
    if (!decoded) return NextResponse.json({ messages: [] });
    const sb = supabaseAdmin();
    const { data } = await sb
      .from('settings')
      .select('value')
      .eq('key', `wa_chatlog_${decoded}`)
      .maybeSingle();
    const v = data?.value as { messages?: Array<{ d: string; t: string; at: number }>; name?: string } | undefined;
    return NextResponse.json({ messages: v?.messages ?? [], name: v?.name ?? '' });
  } catch (e) {
    return dbError(e);
  }
}
