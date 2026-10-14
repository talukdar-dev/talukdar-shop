import { NextResponse } from 'next/server';
import { requireAdmin, dbError } from '../../_guard';
import { waSendText } from '@/lib/wa/whatsapp';

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const phone = String(body.phone ?? '').trim();
    const text = String(body.text ?? '').trim();
    if (!phone || !text) {
      return NextResponse.json({ ok: false, error: 'phone and text required' }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ ok: false, error: 'message too long' }, { status: 400 });
    }
    const sent = await waSendText(phone, text);
    return NextResponse.json({ ok: sent });
  } catch (e) {
    return dbError(e);
  }
}
