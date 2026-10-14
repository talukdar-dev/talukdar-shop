// WhatsApp Cloud API client for Talukdar Shop.
// Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID (Meta provides later — graceful no-op until set).

const API = 'https://graph.facebook.com/v21.0';
// BSUID (Business-Scoped User ID) needs a newer API version — Meta introduced
// WhatsApp usernames in 2026; v21.0 rejects BSUID in `to` as malformed.
const API_BSUID = 'https://graph.facebook.com/v23.0';

// Business-Scoped User ID, e.g. "BD.1074370902101691" — sent instead of a
// phone number when the user chats via WhatsApp username.
export function isBsuid(to: string): boolean {
  return /^[A-Z]{2}\.[0-9]+$/.test(to);
}

function creds() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return null;
  return { token, phoneId };
}

export function waConfigured(): boolean {
  return creds() !== null;
}

async function logDiag(key: string, value: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import('../admin-db');
    const sb = supabaseAdmin();
    await sb.from('settings').upsert(
      { key, value: { ...value, at: new Date().toISOString() } },
      { onConflict: 'key' },
    );
  } catch {
    /* diagnostics best-effort */
  }
}

export function logWebhookHit(from: string, msgId: string, raw: unknown) {
  void logDiag('wa_last_webhook', { from: from.slice(-4), msgId, raw: JSON.stringify(raw).slice(0, 1500) });
}

async function post(path: string, body: Record<string, unknown>): Promise<boolean> {
  const c = creds();
  if (!c) {
    void logDiag('wa_last_error', { stage: 'creds', detail: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing' });
    return false;
  }
  const to = String(body.to ?? '');
  const bsuid = isBsuid(to);
  const base = bsuid ? API_BSUID : API;
  // BSUID users: address via `recipient` field (phone goes in `to` as usual).
  const payload: Record<string, unknown> = { messaging_product: 'whatsapp', ...body };
  if (bsuid) {
    payload.recipient = to;
    delete payload.to;
    payload.recipient_type = 'individual';
  }
  try {
    const res = await fetch(`${base}/${c.phoneId}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      void logDiag('wa_last_error', { stage: 'send', http: res.status, bsuid, detail: errText.slice(0, 300) });
    } else if (bsuid) {
      void logDiag('wa_last_error', { stage: 'send_ok_bsuid', http: res.status });
    }
    return res.ok;
  } catch (e) {
    void logDiag('wa_last_error', { stage: 'fetch', detail: e instanceof Error ? e.message.slice(0, 200) : 'unknown' });
    return false;
  }
}

export async function waSendText(to: string, text: string): Promise<boolean> {
  return post('/messages', { to, type: 'text', text: { body: text } });
}

export async function waSendImage(
  to: string,
  imageUrl: string,
  caption: string,
): Promise<boolean> {
  return post('/messages', {
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  });
}

export interface WaListRow {
  id: string;
  title: string;
  description?: string;
}

// Reply buttons: Telegram-style tap to select (max 3 buttons, title max 20 chars)
export async function waSendButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<boolean> {
  return post('/messages', {
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

export async function waSendList(
  to: string,
  bodyText: string,
  buttonText: string,
  rows: WaListRow[],
): Promise<boolean> {
  return post('/messages', {
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: [{ title: 'Products', rows: rows.slice(0, 10) }],
      },
    },
  });
}

// Product card: image with price caption (best for conversion)
export async function waSendProductCard(
  to: string,
  p: { name: string; slug?: string; price: number; imageUrl?: string; stock: number },
  lang: 'bn' | 'en',
): Promise<boolean> {
  const link = p.slug ? `\nhttps://talukdarshop.com/product/${p.slug}` : '';
  const caption =
    lang === 'bn'
      ? `${p.name}\nদাম: ${p.price} TK${p.stock > 0 ? '' : '\n(স্টক শেষ)'}${link}\n\nনিতে চাইলে "Order" লিখুন`
      : `${p.name}\nPrice: ${p.price} TK${p.stock > 0 ? '' : '\n(Out of stock)'}${link}\n\nReply "Order" to buy`;
  if (p.imageUrl) return waSendImage(to, p.imageUrl, caption);
  return waSendText(to, caption);
}
