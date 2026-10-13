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

async function post(path: string, body: Record<string, unknown>): Promise<boolean> {
  const c = creds();
  if (!c) return false;
  try {
    const res = await fetch(`${API}/${c.phoneId}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    });
    return res.ok;
  } catch {
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
