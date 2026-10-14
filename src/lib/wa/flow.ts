// Conversation engine: state machine, product search, order flow.
// Sessions persist in the `settings` table (key wa_session_<phone>) — no DDL needed.
// Product catalog cached in memory (5-min TTL). Fuzzy match in JS (23 products).

import { supabaseAdmin } from '../admin-db';
import {
  WA_CONFIG,
  SHOP_INFO,
  GREETINGS,
  GREETING_REPLY_BN,
  GREETING_REPLY_EN,
  detectLang,
  pickWaiting,
  KEYWORD_PROMPT,
  finalReplyPrompt,
} from './config';
import { extractIntent, finalReply, type Intent } from './groq';
import { waSendText, waSendImage, waSendList, waSendProductCard } from './whatsapp';

// ---------- catalog cache ----------
interface CatProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category: string;
  brand: string;
  variants: Array<{ name: string; options: Array<{ label: string }> }>;
}

let catalogCache: { at: number; items: CatProduct[]; cats: Array<{ name: string; slug: string; count: number }> } | null = null;

async function getCatalog() {
  if (catalogCache && Date.now() - catalogCache.at < WA_CONFIG.cacheTtlMs) return catalogCache;
  const sb = supabaseAdmin();
  const { data: products } = await sb
    .from('products')
    .select('id,name,price,stock_qty,images,category_id,brand_id,variants')
    .eq('is_active', true);
  const { data: cats } = await sb.from('categories').select('id,name,slug').eq('is_active', true);
  const { data: brands } = await sb.from('brands').select('id,name').eq('is_active', true);
  const brandMap = new Map((brands ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const catMap = new Map((cats ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const items: CatProduct[] = (products ?? []).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    name: String(p.name),
    price: Number(p.price) || 0,
    stock: Number(p.stock_qty) || 0,
    imageUrl: Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : undefined,
    category: String(catMap.get(String(p.category_id)) ?? ''),
    brand: String(brandMap.get(String(p.brand_id)) ?? ''),
    variants: Array.isArray(p.variants) ? (p.variants as CatProduct['variants']) : [],
  }));
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  const catList = (cats ?? []).map((c: { name: string; slug: string }) => ({
    name: c.name,
    slug: c.slug,
    count: counts.get(c.name) ?? 0,
  })).filter((c) => c.count > 0);
  catalogCache = { at: Date.now(), items, cats: catList };
  return catalogCache;
}

// ---------- tiny fuzzy match (typo tolerant) ----------
function similarity(a: string, b: string): number {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  // token overlap
  const at = new Set(a.split(/\s+/)), bt = new Set(b.split(/\s+/));
  let inter = 0;
  for (const t of at) if (bt.has(t)) inter++;
  const tokenScore = (2 * inter) / (at.size + bt.size);
  // char bigrams
  const bigrams = (s: string) => { const m = new Map<string, number>(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) ?? 0) + 1); } return m; };
  const ma = bigrams(a), mb = bigrams(b);
  let hit = 0, total = 0;
  for (const [g, c] of ma) { total += c; hit += Math.min(c, mb.get(g) ?? 0); }
  for (const [g, c] of mb) { if (!ma.has(g)) total += c; }
  const bigramScore = total ? (2 * hit) / total : 0;
  return Math.max(tokenScore, bigramScore * 0.85);
}

function searchProducts(keyword: string, items: CatProduct[], limit = 3): CatProduct[] {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return [];
  return items
    .map((p) => ({ p, s: Math.max(similarity(kw, p.name), similarity(kw, p.category), similarity(kw, p.brand)) }))
    .filter((x) => x.s > 0.35)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

// ---------- sessions (settings table, no DDL) ----------
interface Session {
  step: string;
  data: Record<string, string | number>;
  updatedAt: number;
  shownIds?: string[];
  history?: string[];
}

// keep last 6 turns (user + ai) for context
function pushHistory(s: Session, who: 'user' | 'ai', text: string) {
  const h = s.history ?? [];
  h.push(`${who}: ${text.slice(0, 200)}`);
  s.history = h.slice(-6);
}

async function getSession(phone: string): Promise<Session> {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from('settings').select('value').eq('key', `wa_session_${phone}`).maybeSingle();
    const s = data?.value as Session | undefined;
    if (s && Date.now() - s.updatedAt < WA_CONFIG.sessionTtlMs) return s;
  } catch { /* ignore */ }
  return { step: 'idle', data: {}, updatedAt: Date.now() };
}

async function saveSession(phone: string, s: Session) {
  try {
    const sb = supabaseAdmin();
    s.updatedAt = Date.now();
    await sb.from('settings').upsert({ key: `wa_session_${phone}`, value: s }, { onConflict: 'key' });
  } catch { /* ignore */ }
}

async function clearSession(phone: string) {
  try {
    const sb = supabaseAdmin();
    await sb.from('settings').delete().eq('key', `wa_session_${phone}`);
  } catch { /* ignore */ }
}

// ---------- order save (COD, existing orders table) ----------
async function saveOrder(phone: string, d: Record<string, string | number>, product: CatProduct) {
  try {
    const sb = supabaseAdmin();
    const qty = Number(d.quantity) || 1;
    const delivery = 120; // default outside Dhaka; refined by district later
    await sb.from('orders').insert({
      customer_name: String(d.name || ''),
      phone: String(d.phone || phone),
      address: String(d.address || ''),
      city: 'WhatsApp',
      items: [{ product_id: product.id, name: product.name, price: product.price, qty, image: product.imageUrl }],
      subtotal: product.price * qty,
      shipping: delivery,
      discount: 0,
      total: product.price * qty + delivery,
      payment_method: 'cod',
      payment_status: 'unpaid',
      status: 'pending',
      notes: `WhatsApp order. Variant: ${d.variant || '-'}${d.size ? `, Size: ${d.size}` : ''}`,
    });
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- main handler ----------
export async function handleWaMessage(phone: string, text: string, queueDepth: number) {
  const lang = detectLang(text);
  const msg = text.trim();
  const lower = msg.toLowerCase();

  // 1) greeting — instant, no DB/AI
  if (GREETINGS.has(lower) || (lower.length <= 12 && /^(salam|hello|hi)/.test(lower))) {
    await waSendText(phone, lang === 'bn' ? GREETING_REPLY_BN : GREETING_REPLY_EN);
    return;
  }

  const session = await getSession(phone);
  pushHistory(session, 'user', msg);

  // 2) order flow continuation (state machine first — no AI needed)
  if (session.step !== 'idle') {
    await handleOrderStep(phone, msg, lang, session);
    return;
  }

  // 3) waiting message (varied pool, personal — never "we're busy")
  const pacing = queueDepth >= 8 ? 2500 : queueDepth >= 4 ? 1800 : 1200;
  await waSendText(phone, pickWaiting('search', lang));
  await sleep(pacing);

  // 4) intent via fast model
  let intent: Intent | null = null;
  try {
    intent = await extractIntent(msg, KEYWORD_PROMPT);
  } catch { /* fall through */ }
  const useLang = intent?.lang ?? lang;
  const keyword = intent?.keyword ?? '';
  const kind = intent?.intent ?? 'other';

  // 5) delivery question — answer from training, no product search
  if (kind === 'delivery' || /deliver|cash|payment|bkash|shipping|ডেলিভারি|ক্যাশ/.test(lower)) {
    const reply = useLang === 'bn'
      ? `Sir, amader Cash on Delivery সুবিধা আছে।\nঢাকার ভেতরে ডেলিভারি ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা। ৫০০০ টাকার উপরে অর্ডারে ডেলিভারি ফ্রি।\nঢাকার ভেতরে ২-৩ দিনে, বাইরে ৩-৫ দিনে পাবেন।`
      : `Sir, we offer Cash on Delivery.\nInside Dhaka: 60 TK, outside Dhaka: 120 TK. Free delivery above 5000 TK.\n2-3 days inside Dhaka, 3-5 days outside.`;
    await waSendText(phone, reply);
    return;
  }

  const cat = await getCatalog();

  // 6) broad browse — categories with counts (token saving)
  if (kind === 'browse' || (!keyword && kind !== 'search')) {
    const lines = cat.cats.slice(0, 12).map((c, i) => `${i + 1}. ${c.name} (${c.count} ta)`);
    const reply = useLang === 'bn'
      ? `Sir, amader kache ei category gulo ache:\n${lines.join('\n')}\n\nKonta dekhte chan sir?`
      : `Sir, we have these categories:\n${lines.join('\n')}\n\nWhich one would you like to see?`;
    await waSendText(phone, reply);
    pushHistory(session, 'ai', 'shown categories');
    await saveSession(phone, { step: 'idle', data: {}, updatedAt: Date.now(), history: session.history });
    return;
  }

  // 7) product search (max 3, fuzzy)
  await waSendText(phone, pickWaiting('stock', useLang));
  await sleep(Math.min(pacing, 1500));
  const found = searchProducts(keyword || msg, cat.items, WA_CONFIG.maxProductsPerReply);

  if (found.length === 0) {
    const reply = useLang === 'bn'
      ? `Sir, "${msg}" nam e ekhon stock-e pacchi na. Onno nam e likhe dekhun, ba category bolun — ami ber kore dicchi.`
      : `Sir, I could not find "${msg}" in stock right now. Please try another name or tell me the category.`;
    await waSendText(phone, reply);
    return;
  }

  // 8) show products: image cards + interactive list
  for (const p of found) {
    await waSendProductCard(phone, p, useLang);
    await sleep(900);
  }
  await waSendList(
    phone,
    useLang === 'bn' ? 'Sir, tap kore select korun:' : 'Sir, tap to select:',
    useLang === 'bn' ? 'Products' : 'Products',
    found.map((p, i) => ({
      id: `prod_${p.id}`,
      title: `${i + 1}. ${p.name.slice(0, 24)}`,
      description: `${p.price} TK${p.stock > 0 ? '' : ' (stock sesh)'}`,
    })),
  );

  // remember shown products, ask variant AFTER selection (lazy)
  pushHistory(session, 'ai', `shown ${found.length} products`);
  await saveSession(phone, {
    step: 'await_product_choice',
    data: {},
    shownIds: found.map((p) => p.id),
    updatedAt: Date.now(),
    history: session.history,
  });

  const histCtx = session.history?.length ? `\nRecent chat:\n${session.history.join('\n')}` : '';
  const ctx = `Shown ${found.length} products. Ask which one they want (1/2/3). Variants only when asked.${histCtx}`;
  const aiReply = await finalReply(
    finalReplyPrompt({ lang: useLang, customerMsg: msg, products: found, context: ctx }),
    msg,
  );
  if (aiReply) await waSendText(phone, aiReply);
  else await waSendText(phone, useLang === 'bn'
    ? 'Sir, konta nite chan? 1, 2 na 3 likhun.'
    : 'Sir, which one would you like? Reply 1, 2 or 3.');
}

// ---------- order steps ----------
async function handleOrderStep(phone: string, msg: string, lang: 'bn' | 'en', session: Session) {
  const cat = await getCatalog();
  const d = session.data;

  const ask = async (text: string) => { await waSendText(phone, text); };

  switch (session.step) {
    case 'await_product_choice': {
      const idx = parseInt(msg) - 1;
      const prod = (session.shownIds ?? [])[idx] ? cat.items.find((p) => p.id === (session.shownIds ?? [])[idx]) : undefined;
      // also allow tapping list row id
      const byId = msg.startsWith('prod_') ? cat.items.find((p) => `prod_${p.id}` === msg) : undefined;
      const chosen = prod ?? byId;
      if (!chosen) {
        await ask(lang === 'bn' ? 'Sir, 1, 2 ba 3 er moddhe ekti likhun.' : 'Sir, please reply 1, 2 or 3.');
        return;
      }
      d.product_id = chosen.id;
      // variant lazy: only if product HAS variants
      if (chosen.variants.length > 0) {
        const v = chosen.variants[0];
        session.step = 'await_variant';
        await saveSession(phone, session);
        await ask(lang === 'bn'
          ? `Sir, "${chosen.name}" er ${v.name} gulo: ${v.options.map((o) => o.label).join(', ')}. Konta lagbe sir?`
          : `Sir, "${chosen.name}" options for ${v.name}: ${v.options.map((o) => o.label).join(', ')}. Which one, sir?`);
      } else {
        session.step = 'await_quantity';
        await saveSession(phone, session);
        await ask(lang === 'bn' ? 'Sir, quantity koto pcs lagbe?' : 'Sir, how many pieces?');
      }
      return;
    }
    case 'await_variant': {
      d.variant = msg;
      session.step = 'await_quantity';
      await saveSession(phone, session);
      await ask(lang === 'bn' ? 'Sir, quantity koto pcs lagbe?' : 'Sir, how many pieces?');
      return;
    }
    case 'await_quantity': {
      d.quantity = /^\d+$/.test(msg.trim()) ? msg.trim() : '1';
      session.step = 'await_name';
      await saveSession(phone, session);
      await ask(lang === 'bn' ? 'Sir, apnar nam ta bolun.' : 'Sir, your name please.');
      return;
    }
    case 'await_name': {
      d.name = msg;
      session.step = 'await_address';
      await saveSession(phone, session);
      await ask(lang === 'bn' ? 'Sir, full address ta din (basa/road, area, thana, district).' : 'Sir, your full address please (house/road, area, district).');
      return;
    }
    case 'await_address': {
      d.address = msg;
      session.step = 'await_phone';
      await saveSession(phone, session);
      await ask(lang === 'bn' ? 'Sir, phone number ta diben.' : 'Sir, your phone number please.');
      return;
    }
    case 'await_phone': {
      d.phone = msg.replace(/\D/g, '');
      const product = cat.items.find((p) => p.id === d.product_id);
      session.step = 'await_confirm';
      await saveSession(phone, session);
      const qty = Number(d.quantity) || 1;
      const total = product ? product.price * qty : 0;
      await ask(lang === 'bn'
        ? `Sir, confirm korchi:\n${product?.name ?? ''}${d.variant ? ` (${d.variant})` : ''}\nQuantity: ${qty} pcs\nTotal: ${total} TK (Cash on Delivery)\nNam: ${d.name}\nAddress: ${d.address}\nPhone: ${d.phone}\n\nThik ache sir? "Ha" likhun. ✅`
        : `Sir, confirming:\n${product?.name ?? ''}${d.variant ? ` (${d.variant})` : ''}\nQty: ${qty} pcs\nTotal: ${total} TK (Cash on Delivery)\nName: ${d.name}\nAddress: ${d.address}\nPhone: ${d.phone}\n\nCorrect, sir? Reply "Yes". ✅`);
      return;
    }
    case 'await_confirm': {
      if (/^(ha|yes|y|hyan|thik|ok|confirm)/i.test(msg.trim())) {
        const product = cat.items.find((p) => p.id === d.product_id);
        await waSendText(phone, pickWaiting('order', lang));
        const ok = product ? await saveOrder(phone, d, product) : false;
        await clearSession(phone);
        await ask(ok
          ? (lang === 'bn'
            ? 'Dhonnobad Sir! ✅ Apnar order confirm hoyeche. Amader team call kore confirm korbe. Hotline: 01333600272'
            : 'Thank you Sir! ✅ Your order is confirmed. Our team will call you to confirm. Hotline: 01333600272')
          : (lang === 'bn'
            ? 'Sir, order save korte somossa hocche. Hotline 01333600272 te call korun.'
            : 'Sir, there was an issue saving your order. Please call 01333600272.'));
      } else {
        await clearSession(phone);
        await ask(lang === 'bn' ? 'Thik ache Sir, order cancel kora holo. Abar proyojon hole janaben.' : 'Alright Sir, order cancelled. Let me know if you need anything.');
      }
      return;
    }
    default:
      await clearSession(phone);
  }
}
