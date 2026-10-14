// Debug: checks WhatsApp + Groq wiring without exposing secrets.
// GET /api/whatsapp/debug -> JSON status
import { NextResponse } from 'next/server';

export async function GET() {
  const has = (k: string) => !!process.env[k];
  const out: Record<string, unknown> = {
    env: {
      WHATSAPP_VERIFY_TOKEN: has('WHATSAPP_VERIFY_TOKEN'),
      WHATSAPP_TOKEN: has('WHATSAPP_TOKEN'),
      WHATSAPP_PHONE_ID: has('WHATSAPP_PHONE_ID'),
      GROQ_API_KEY: has('GROQ_API_KEY'),
    },
  };

  // check WhatsApp token validity via Meta debug endpoint
  const token = process.env.WHATSAPP_TOKEN;
  if (token) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      out.waToken = { http: r.status, valid: !!j?.data?.is_valid, error: j?.error?.message ?? j?.data?.error?.message ?? null, scopes: j?.data?.scopes ?? null };
    } catch (e) {
      out.waToken = { error: e instanceof Error ? e.message : 'fetch failed' };
    }
  } else {
    out.waToken = { error: 'WHATSAPP_TOKEN missing' };
  }

  // check Groq key with a tiny request
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groq}` },
        signal: AbortSignal.timeout(15000),
      });
      out.groq = { http: r.status, ok: r.ok };
    } catch (e) {
      out.groq = { error: e instanceof Error ? e.message : 'fetch failed' };
    }
  } else {
    out.groq = { error: 'GROQ_API_KEY missing' };
  }

  return NextResponse.json(out);
}
