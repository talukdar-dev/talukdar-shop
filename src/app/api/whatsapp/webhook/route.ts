// WhatsApp Cloud API webhook for Talukdar Shop AI sales agent.
// GET  -> webhook verification (Meta setup)
// POST -> incoming message -> AI flow
// Env needed: WHATSAPP_VERIFY_TOKEN (Meta gives later), GROQ_API_KEY (set)

import { NextRequest, NextResponse } from 'next/server';
import { handleWaMessage } from '@/lib/wa/flow';
import { detectLang } from '@/lib/wa/config';
import { logWebhookHit, logChat } from '@/lib/wa/whatsapp';

// concurrent processing counter -> adaptive pacing signal
let activeJobs = 0;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const mode = q.get('hub.mode');
  const token = q.get('hub.verify_token');
  const challenge = q.get('hub.challenge');
  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && verify && token === verify) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  // verification endpoint reachable even before Meta creds arrive
  return NextResponse.json({ ok: true, webhook: 'talukdar-shop-whatsapp', verifySet: !!verify });
}

interface WaTextMsg {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  interactive?: { type: string; list_reply?: { id: string; title: string }; button_reply?: { id: string; title: string } };
  raw?: unknown;
}

function extractMessage(body: Record<string, unknown>): WaTextMsg | null {
  try {
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = change?.value as Record<string, unknown>;
    const msg = (value?.messages as Array<Record<string, unknown>>)?.[0];
    if (!msg) return null;
    // phone can be in messages[0].from (standard) or value.contacts[0].wa_id (alternate routing)
    const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;
    const waId = contacts?.[0]?.wa_id ? String(contacts[0].wa_id) : '';
    const from = String(msg.from ?? '') || waId || String((msg as Record<string, unknown>).from_user_id ?? '');
    return {
      from,
      id: String(msg.id ?? ''),
      type: String(msg.type ?? ''),
      text: msg.text as WaTextMsg['text'],
      interactive: msg.interactive as WaTextMsg['interactive'],
      raw: { message: msg, contacts: contacts ?? null },
    };
  } catch {
    return null;
  }
}

// dedupe: WhatsApp may retry webhooks. Use DB (not memory) — serverless instances don't share memory.
async function isDuplicateDb(id: string): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/lib/admin-db');
    const sb = supabaseAdmin();
    const key = `wa_msg_${id}`;
    const { data } = await sb.from('settings').select('key').eq('key', key).maybeSingle();
    if (data) return true;
    await sb.from('settings').upsert({ key, value: { at: Date.now() } }, { onConflict: 'key' });
    return false;
  } catch {
    return false; // fail open — better to risk dup than drop message
  }
}

// content dedupe: Meta sometimes delivers the SAME user message multiple times
// with DIFFERENT message IDs (BSUID/username flow), spaced minutes apart.
// If the same phone sends the same text within 5 min, treat as duplicate.
async function isDuplicateContent(phone: string, text: string): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/lib/admin-db');
    const sb = supabaseAdmin();
    const key = `wa_lastmsg_${phone}`;
    const now = Date.now();
    const { data } = await sb.from('settings').select('value').eq('key', key).maybeSingle();
    const last = data?.value as { text?: string; at?: number } | undefined;
    // always record the latest
    await sb.from('settings').upsert(
      { key, value: { text: text.slice(0, 200), at: now } },
      { onConflict: 'key' },
    );
    if (last?.text && last.at && now - last.at < 5 * 60_000) {
      if (last.text.trim().toLowerCase() === text.trim().toLowerCase()) return true;
    }
    return false;
  } catch {
    return false; // fail open
  }
}

// in-memory fallback for same-instance speed
const seen = new Map<string, number>();
function isDuplicateMem(id: string): boolean {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 10 * 60_000) seen.delete(k);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const msg = extractMessage(body);
  if (!msg || isDuplicateMem(msg.id)) return NextResponse.json({ ok: true });
  if (await isDuplicateDb(msg.id)) return NextResponse.json({ ok: true });

  // diagnostic: record that Meta's webhook reached us (raw payload for structure check)
  logWebhookHit(msg.from, msg.id, msg.raw ?? msg);

  // resolve text from text or interactive replies
  let text = '';
  if (msg.type === 'text' && msg.text?.body) text = msg.text.body;
  else if (msg.type === 'interactive' && msg.interactive) {
    const it = msg.interactive;
    text = it.list_reply?.id ?? it.list_reply?.title ?? it.button_reply?.id ?? it.button_reply?.title ?? '';
  }
  if (!text.trim()) return NextResponse.json({ ok: true });

  // content dedupe: same text from same phone within 5 min → skip (Meta multi-delivery)
  if (await isDuplicateContent(msg.from, text.trim())) return NextResponse.json({ ok: true });

  // log incoming message for admin chat viewer
  void logChat(msg.from, 'in', text.trim());

  // Process inline and await — DB dedupe above already blocks Meta retries,
  // so a slow 200 is safe (no duplicates). Fire-and-forget would get killed by Vercel.
  activeJobs++;
  const depth = activeJobs;
  try {
    await Promise.race([
      handleWaMessage(msg.from, text.trim(), depth),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 7 * 60_000)),
    ]);
  } catch (e) {
    console.error('[wa] handler error', e);
  } finally {
    activeJobs = Math.max(0, activeJobs - 1);
  }

  // keep variable referenced (language fallback safety)
  void detectLang;

  return NextResponse.json({ ok: true });
}
