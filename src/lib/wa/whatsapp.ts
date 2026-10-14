// WhatsApp Cloud API client for Talukdar Shop.
// Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID (Meta provides later — graceful no-op until set).

const API = 'https://graph.facebook.com/v21.0';

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

export function logWebhookHit(from: string, msgId: string, textLen: number) {
  void logDiag('wa_last_webhook', { from: from.slice(-4), msgId, textLen });
}

async function post(path: string, body: Record<string, unknown>): Promise<boolean> {
  const c = creds();
  if (!c) {
    void logDiag('wa_last_error', { stage: 'creds', detail: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing' });
    return false;
  }
  try {
    const res = await fetch(`${API}/${c.phoneId}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      void logDiag('wa_last_error', { stage: 'send', http: res.status, detail: errText.slice(0, 300) });
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
  p: { name: string; price: number; imageUrl?: string; stock: number },
  lang: 'bn' | 'en',
): Promise<boolean> {
  const caption =
    lang === 'bn'
      ? `${p.name}\nদাম: ${p.price} TK${p.stock > 0 ? '' : '\n(স্টক শেষ)'}\n\nনিতে চাইলে "Order" লিখুন`
      : `${p.name}\nPrice: ${p.price} TK${p.stock > 0 ? '' : '\n(Out of stock)'}\n\nReply "Order" to buy`;
  if (p.imageUrl) return waSendImage(to, p.imageUrl, caption);
  return waSendText(to, caption);
}
