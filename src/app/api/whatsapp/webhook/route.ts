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
    // BSUID/username flow uses from_user_id + contacts[0].user_id instead
    const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;
    const waId = contacts?.[0]?.wa_id ? String(contacts[0].wa_id)
      : contacts?.[0]?.user_id ? String(contacts[0].user_id) : '';
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
// Every unique (phone + text) gets a fingerprint, kept for 5 min —
// so even a LATE duplicate of an older message is caught, not just the last one.
function fp(text: string): string {
  const t = text.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < t.length; i++) { h = ((h << 5) - h + t.charCodeAt(i)) | 0; }
  return `h${(h >>> 0).toString(36)}`;
}
const DEDUPE_TTL = 5 * 60_000;
// ATOMIC entry-point gate: the same message text can NEVER reach the backend twice.
// Uses database unique constraint — INSERT (not upsert) so only one concurrent
// webhook can claim a fingerprint; the loser gets 23505 conflict = duplicate.
// Key includes a 5-min time bucket so fingerprints auto-expire.
async function isDuplicateContent(phone: string, text: string): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/lib/admin-db');
    const sb = supabaseAdmin();
    const now = Date.now();
    const myFp = fp(text);
    const bucket = Math.floor(now / DEDUPE_TTL);
    // current + previous bucket (handles bucket boundary, e.g. msg at 04:59, dup at 05:01)
    // per-phone: different customers sending the same text must NOT block each other
    const curKey = `wa_fp_${phone}_${myFp}_${bucket}`;
    const prevKey = `wa_fp_${phone}_${myFp}_${bucket - 1}`;
    const { data } = await sb.from('settings').select('key,value').in('key', [curKey, prevKey]);
    if (data) {
      for (const row of data as Array<{ value: unknown }>) {
        const at = (row.value as { at?: number } | undefined)?.at ?? 0;
        if (now - at < DEDUPE_TTL) return true;
      }
    }
    // atomic claim — unique key constraint makes this race-proof
    const { error } = await sb.from('settings').insert({ key: curKey, value: { at: now, phone } });
    if (error) {
      const code = (error as { code?: string }).code;
      const msg = String(error.message ?? '').toLowerCase();
      if (code === '23505' || msg.includes('duplicate') || msg.includes('already exists')) return true;
      return false; // other DB error → fail open
    }
    // lazy cleanup: drop fingerprint rows older than 30 min (best-effort)
    if (Math.random() < 0.05) {
      void (async () => {
        try {
          const { data: old } = await sb.from('settings').select('key,value').like('key', 'wa_fp_%').limit(200);
          const stale = (old ?? []).filter((r: { value: unknown }) => {
            const at = ((r.value as { at?: number } | undefined)?.at ?? 0);
            return now - at > 30 * 60_000;
          }).map((r: { key: string }) => r.key);
          if (stale.length) await sb.from('settings').delete().in('key', stale);
        } catch { /* cleanup best-effort */ }
      })();
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
