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
} from './config';
import { extractIntent, finalReply, type Intent } from './groq';
import { brainUnderstand, finderRank, brainWriteReply, type BrainDecision } from './brain';
import { waSendText, waSendImage, waSendList, waSendButtons, waSendProductCard } from './whatsapp';

// Smart truncate: cut at word boundary, never mid-word
function smartCut(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim();
}

// ---------- catalog cache ----------
export interface CatProduct {
  id: string;
  name: string;
  slug: string;
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
    .select('id,name,slug,price,stock_qty,images,category_id,brand_id,variants')
    .eq('is_active', true);
  const { data: cats } = await sb.from('categories').select('id,name,slug').eq('is_active', true);
  const { data: brands } = await sb.from('brands').select('id,name').eq('is_active', true);
  const brandMap = new Map((brands ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const catMap = new Map((cats ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const items: CatProduct[] = (products ?? []).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    name: String(p.name),
    slug: String(p.slug ?? ''),
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
  const scored = items
    .map((p) => ({ p, s: Math.max(similarity(kw, p.name), similarity(kw, p.category), similarity(kw, p.brand)) }))
    .filter((x) => x.s > 0.35)
    .sort((a, b) => b.s - a.s);
  if (scored.length === 0) return [];

  // Smart filter: if ONE category dominates (strong exact-ish match), drop weak cross-category noise.
  // e.g. "room heater" -> Room Heater (1.0), not Water Heater (0.5) or Battery.
  // e.g. "fan" -> Ceiling Fan (0.9) AND DC Fan (0.9) tie -> keep both.
  const catBest = new Map<string, number>();
  for (const x of scored) {
    const cs = Math.max(similarity(kw, x.p.category), similarity(kw, x.p.name));
    catBest.set(x.p.category, Math.max(catBest.get(x.p.category) ?? 0, cs));
  }
  const sorted_cats = [...catBest.entries()].sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = sorted_cats[0];
  const secondScore = sorted_cats[1]?.[1] ?? 0;
  // dominant = top is near-exact (>=0.85) and clearly ahead of runner-up (gap > 0.25)
  const dominant = topScore >= 0.85 && topScore - secondScore > 0.25;
  const filtered = dominant ? scored.filter((x) => x.p.category === topCat) : scored;
  return filtered.slice(0, limit).map((x) => x.p);
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
  const msg = text.trim();
  const lower = msg.toLowerCase();

  const session = await getSession(phone);
  pushHistory(session, 'user', msg);
  const history = session.history ?? [];

  // 0) greeting — instant, no AI
  if (GREETINGS.has(lower) || (lower.length <= 12 && /^(salam|hello|hi)/.test(lower))) {
    const lang = detectLang(text);
    const reply = lang === 'bn' ? GREETING_REPLY_BN : GREETING_REPLY_EN;
    await waSendText(phone, reply);
    pushHistory(session, 'ai', 'greeting');
    await saveSession(phone, { step: 'idle', data: {}, updatedAt: Date.now(), history: session.history });
    return;
  }

  // 1) 🤖 AGENT MODE — like ChatGPT: the 120B thinks, uses tools, replies.
  // Falls back to legacy brain flow if agent fails.
  const pacing = queueDepth >= 8 ? 2500 : queueDepth >= 4 ? 1800 : 1200;
  const quickLang = detectLang(text);
  await waSendText(phone, pickWaiting('search', quickLang));
  await sleep(pacing);

  const cat = await getCatalog();
  const agentOk = await runAgent(phone, msg, {
    products: cat.items,
    history,
    sessionData: session.data,
  }, session);
  if (agentOk) return;

  // 2) Legacy fallback: brain understand flow
  await handleLegacyBrain(phone, msg, quickLang, session, history, cat, pacing);
}

// ---------- agent runner ----------
async function runAgent(
  phone: string,
  msg: string,
  ctx: { products: CatProduct[]; history: string[]; sessionData: Record<string, string | number> },
  session: Session,
): Promise<boolean> {
  const { agentThink, agentExecTool } = await import('./agent');
  const toolResults: { tool: string; result: string }[] = [];

  for (let i = 0; i < 4; i++) {
    let step: { thought: string; tool: Record<string, unknown> | null; reply: string | null } | null = null;
    try {
      step = await agentThink(msg, ctx, toolResults);
    } catch { return false; }
    if (!step) return false;

    // log thought for debugging (not sent to customer)
    pushHistory(session, 'ai', `[thought] ${step.thought.slice(0, 150)}`);

    if (step.tool) {
      const toolName = String(step.tool.tool ?? '');
      // save_order needs DB — handle specially
      if (toolName === 'save_order') {
        const ok = await execSaveOrder(phone, step.tool, ctx);
        toolResults.push({ tool: 'save_order', result: ok ? 'Order saved successfully!' : 'Failed to save order' });
        // after save, let agent write confirmation
        continue;
      }
      // search_products: also send visual cards
      if (toolName === 'search_products') {
        const res = await agentExecTool(step.tool, ctx);
        toolResults.push(res);
        // send product cards for visual impact
        const kw = String(step.tool.keyword ?? '').toLowerCase();
        const matches = ctx.products.filter((p) =>
          p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw),
        ).slice(0, 3);
        const lang = detectLang(msg);
        for (const p of matches) {
          await waSendProductCard(phone, p, lang);
          await new Promise((r) => setTimeout(r, 800));
        }
        if (matches.length > 0) {
          await waSendButtons(
            phone,
            lang === 'bn' ? 'Sir, konta nite chan? Tap korun:' : 'Sir, which one? Tap to select:',
            matches.map((p, idx) => ({ id: `prod_${p.id}`, title: `${idx + 1}. ${smartCut(p.name, 17)}` })),
          );
          session.step = 'await_product_choice';
          session.shownIds = matches.map((p) => p.id);
        }
        continue;
      }
      const res = await agentExecTool(step.tool, ctx);
      toolResults.push(res);
      continue;
    }

    if (step.reply) {
      await waSendText(phone, step.reply);
      pushHistory(session, 'ai', step.reply.slice(0, 200));
      await saveSession(phone, {
        step: session.step,
        data: session.data,
        shownIds: session.shownIds,
        updatedAt: Date.now(),
        history: session.history,
      });
      return true;
    }
    // no tool, no reply — stop
    return false;
  }
  return false;
}

async function execSaveOrder(
  phone: string,
  tool: Record<string, unknown>,
  ctx: { products: CatProduct[] },
): Promise<boolean> {
  const product = ctx.products.find((p) => p.id === String(tool.product_id));
  if (!product) return false;
  const d: Record<string, string | number> = {
    product_id: product.id,
    name: String(tool.name ?? ''),
    address: String(tool.address ?? ''),
    phone: String(tool.phone ?? '').replace(/\D/g, ''),
    quantity: String(tool.quantity ?? '1'),
  };
  if (!d.name || !d.address || !/^01\d{9}$/.test(String(d.phone))) return false;
  return await saveOrderToDb(phone, d, product);
}

// wrapper so agent can save orders (extracted from saveOrder logic)
async function saveOrderToDb(phone: string, d: Record<string, string | number>, product: CatProduct): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('../admin-db');
    const sb = supabaseAdmin();
    const qty = Number(d.quantity) || 1;
    const addr = String(d.address ?? '').toLowerCase();
    const isDhaka = /dhaka|ঢাকা/.test(addr);
    const delivery = product.price * qty >= 5000 ? 0 : isDhaka ? 60 : 120;
    const { error } = await sb.from('orders').insert({
      customer_name: String(d.name),
      customer_phone: String(d.phone),
      customer_address: String(d.address),
      items: [{ product_id: product.id, name: product.name, price: product.price, quantity: qty }],
      subtotal: product.price * qty,
      shipping: delivery,
      discount: 0,
      total: product.price * qty + delivery,
      payment_method: 'cod',
      payment_status: 'unpaid',
      status: 'pending',
      notes: 'WhatsApp AI order',
    });
    return !error;
  } catch {
    return false;
  }
}

// ---------- legacy brain fallback ----------
async function handleLegacyBrain(
  phone: string,
  msg: string,
  quickLang: 'bn' | 'en',
  session: Session,
  history: string[],
  cat: { items: CatProduct[]; cats: Array<{ name: string; slug: string; count: number }> },
  pacing: number,
) {
  // 2) order flow continuation — brain interprets within order context
  if (session.step !== 'idle') {
    await handleOrderStep(phone, msg, quickLang, session, 0);
    return;
  }

  // 3) waiting message already sent; proceed to brain
  const text = msg; // for detectLang fallback

  // 4) 🧠 120B UNDERSTANDS the message
  let brain: BrainDecision | null = null;
  try {
    brain = await brainUnderstand(msg, history);
  } catch { /* fall through */ }
  const useLang = brain?.lang ?? quickLang;
  const action = brain?.action ?? 'other';
  const keyword = brain?.keyword ?? '';
  const understanding = brain?.understanding ?? '';

  const saveIdle = async (aiNote: string) => {
    pushHistory(session, 'ai', aiNote);
    await saveSession(phone, { step: 'idle', data: {}, updatedAt: Date.now(), history: session.history });
  };

  // 5) delivery question — 120B writes the answer
  if (action === 'delivery_info') {
    const reply = await brainWriteReply({
      lang: useLang, customerMsg: msg, understanding, history,
      dataText: 'Delivery: Cash on Delivery only. Inside Dhaka 60 TK (2-3 days), outside Dhaka 120 TK (3-5 days), free above 5000 TK. Hotline 01333600272.',
      instruction: 'Answer their delivery question briefly using the data.',
    });
    await waSendText(phone, reply ?? (useLang === 'bn'
      ? 'Sir, Cash on Delivery আছে। ঢাকায় ৬০ টাকা, বাইরে ১২০ টাকা।'
      : 'Sir, Cash on Delivery available. Dhaka 60 TK, outside 120 TK.'));
    await saveIdle('answered delivery');
    return;
  }

  // 6) order cancel (no active order, but they say cancel)
  if (action === 'order_cancel') {
    const reply = await brainWriteReply({
      lang: useLang, customerMsg: msg, understanding, history, dataText: '',
      instruction: 'They want to cancel. Confirm cancellation politely, ask if they need anything else.',
    });
    await waSendText(phone, reply ?? (useLang === 'bn' ? 'ঠিক আছে Sir, cancel করে দিলাম।' : 'Okay Sir, cancelled.'));
    await saveIdle('cancelled');
    return;
  }

  // 7) human handover
  if (action === 'human') {
    await waSendText(phone, useLang === 'bn'
      ? 'Sir, আমাদের টিমের সাথে কথা বলতে হটলাইন 01333600272 তে কল করুন (সকাল ৯টা - রাত ১০টা)।'
      : 'Sir, please call our hotline 01333600272 (9AM-10PM) to speak with our team.');
    await saveIdle('human handover');
    return;
  }

  // 7b) 🧠 not sure what they want? ASK, don't guess.
  if (action === 'clarify' || brain?.confidence === 'low') {
    const q = brain?.clarifyQuestion || (useLang === 'bn'
      ? 'Sir, bujhte parlam na. Kon product chacchen ektu bolun?'
      : 'Sir, I did not quite understand. Which product are you looking for?');
    await waSendText(phone, q);
    await saveIdle('asked clarification');
    return;
  }

  // 8) broad browse — categories with counts
  // (cat passed as parameter)
  if (action === 'other' && !keyword) {
    const lines = cat.cats.slice(0, 12).map((c, i) => `${i + 1}. ${c.name} (${c.count} ta)`);
    const intro = await brainWriteReply({
      lang: useLang, customerMsg: msg, understanding, history,
      dataText: `Categories:\n${lines.join('\n')}`,
      instruction: 'Show the category list briefly, ask which one they want to see.',
    });
    await waSendText(phone, intro ?? (useLang === 'bn'
      ? `Sir, amader kache ei category gulo ache:\n${lines.join('\n')}\n\nKonta dekhte chan sir?`
      : `Sir, we have these categories:\n${lines.join('\n')}\n\nWhich one would you like to see?`));
    await saveIdle('shown categories');
    return;
  }

  // 9) 🔍 product search — 20B FINDS, 120B presents
  if (action === 'search' || action === 'category_ask' || action === 'product_info' || action === 'price_ask' || keyword) {
    await waSendText(phone, pickWaiting('stock', useLang));
    await sleep(Math.min(pacing, 1500));

    const candidates = searchProducts(keyword || msg, cat.items, 12);
    if (candidates.length === 0) {
      const reply = await brainWriteReply({
        lang: useLang, customerMsg: msg, understanding, history, dataText: '',
        instruction: `No products found for "${keyword || msg}". Apologize briefly, suggest trying another name or category.`,
      });
      await waSendText(phone, reply ?? (useLang === 'bn'
        ? `Sir, "${msg}" এখন stock-e pacchi na. Onno nam e likhe dekhun.`
        : `Sir, could not find "${msg}" in stock. Try another name.`));
      await saveIdle('not found');
      return;
    }

    // category-first: multiple types? ask which one
    const matchCats = [...new Set(candidates.map((p) => p.category).filter(Boolean))];
    if (matchCats.length > 1 && action === 'search') {
      const bodyText = useLang === 'bn'
        ? `Sir, "${keyword}" er ${matchCats.length} dhoroner ache. Konta chaitasen?`
        : `Sir, "${keyword}" comes in ${matchCats.length} types. Which one?`;
      if (matchCats.length <= 3) {
        await waSendButtons(phone, bodyText, matchCats.map((c, i) => ({ id: `catchoose_${i}`, title: c })));
      } else {
        await waSendText(phone, bodyText);
      }
      pushHistory(session, 'ai', `asked type: ${matchCats.join(', ')}`);
      await saveSession(phone, {
        step: 'await_category_choice',
        data: { keyword: keyword || msg },
        shownIds: matchCats,
        updatedAt: Date.now(),
        history: session.history,
      });
      return;
    }

    // 20B ranks the candidates, picks best 3
    const rankedIds = await finderRank(keyword || msg, candidates);
    const found = rankedIds
      .map((id) => candidates.find((c) => c.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 3);

    // product cards with images + links
    for (const p of found) {
      await waSendProductCard(phone, p, useLang);
      await sleep(900);
    }
    // tap buttons
    await waSendButtons(
      phone,
      useLang === 'bn' ? 'Sir, konta nite chan? Tap korun:' : 'Sir, which one? Tap to select:',
      found.map((p, i) => ({ id: `prod_${p.id}`, title: `${i + 1}. ${smartCut(p.name, 17)}` })),
    );

    pushHistory(session, 'ai', `shown ${found.length} products`);
    await saveSession(phone, {
      step: 'await_product_choice',
      data: {},
      shownIds: found.map((p) => p.id),
      updatedAt: Date.now(),
      history: session.history,
    });
    return;
  }

  // 10) order start — begin conversational order
  if (action === 'order_start') {
    // (handled via product choice normally; fallback: ask what they want)
    const reply = await brainWriteReply({
      lang: useLang, customerMsg: msg, understanding, history, dataText: '',
      instruction: 'They want to order but no product selected yet. Ask which product they want.',
    });
    await waSendText(phone, reply ?? (useLang === 'bn' ? 'Sir, kon product ta order korte chan?' : 'Sir, which product would you like to order?'));
    await saveIdle('order start w/o product');
    return;
  }

  // 11) fallback — 120B handles it naturally
  const reply = await brainWriteReply({
    lang: useLang, customerMsg: msg, understanding: understanding || 'unclear message', history, dataText: '',
    instruction: 'Respond naturally and helpfully. If unclear, ask what product they are looking for.',
  });
  if (reply) {
    await waSendText(phone, reply);
    await saveIdle('fallback reply');
  }
}

// NOTE: old product-display block removed — brain flow handles it above.

// re-ask the current order step question (after language switch)
async function reaskStep(phone: string, session: Session, cat: Awaited<ReturnType<typeof getCatalog>>, d: Record<string, string | number>) {
  const lang = (session.data.lang as 'bn' | 'en') || 'bn';
  const ask = async (t: string) => { await waSendText(phone, t); };
  switch (session.step) {
    case 'await_quantity':
      await ask(lang === 'bn' ? 'Sir, quantity koto pcs lagbe?' : 'Sir, how many pieces?');
      break;
    case 'await_name':
      await ask(lang === 'bn' ? 'Sir, apnar nam ta bolun.' : 'Sir, your name please.');
      break;
    case 'await_address':
      await ask(lang === 'bn' ? 'Sir, full address ta din (basa/road, area, thana, district).' : 'Sir, your full address please (house/road, area, district).');
      break;
    case 'await_phone':
      await ask(lang === 'bn' ? 'Sir, phone number ta diben.' : 'Sir, your phone number please.');
      break;
    case 'await_confirm':
      await ask(lang === 'bn' ? 'Sir, confirm korte "Ha" likhun.' : 'Sir, reply "Yes" to confirm.');
      break;
    default:
      break;
  }
}

// ---------- order steps ----------
const CANCEL_WORDS = /\b(cancel|bad\s?den|bad|lagbe\s?na|chai\s?na|korbo\s?na|dibo\s?na|dimo\s?na|nibo\s?na|order\s?(korbo|dibo|dimo)\s?na|thak|na\s?lagbe)\b/i;
const BANGLA_SWITCH = /\bbangla\s?(bolo|te|bhasha)\b/i;
const ENGLISH_SWITCH = /\benglish\s?(bolo|speak|me)\b/i;

async function handleOrderStep(phone: string, msg: string, lang: 'bn' | 'en', session: Session, queueDepth: number) {
  const cat = await getCatalog();
  const d = session.data;
  const lower = msg.toLowerCase().trim();
  const effLang = (session.data.lang as 'bn' | 'en') || lang;

  const ask = async (text: string) => { await waSendText(phone, text); };

  // --- smart guards: cancellation / language switch / new query ---
  // (skip for await_product_choice which has its own new-query detection)
  if (session.step !== 'await_product_choice' && session.step !== 'await_category_choice') {
    if (CANCEL_WORDS.test(lower)) {
      await clearSession(phone);
      pushHistory(session, 'ai', 'order cancelled');
      await ask(effLang === 'bn'
        ? 'ঠিক আছে Sir, order cancel করে দিলাম। অন্য কিছু লাগলে জানাবেন।'
        : 'Okay Sir, order cancelled. Let me know if you need anything else.');
      return;
    }
    if (BANGLA_SWITCH.test(lower)) {
      session.data.lang = 'bn';
      await saveSession(phone, session);
      await ask('ঠিক আছে Sir, বাংলায় বলছি। আগের প্রশ্নটা আবার করি —');
      // re-ask current step in Bangla
      await reaskStep(phone, session, cat, d);
      return;
    }
    if (ENGLISH_SWITCH.test(lower)) {
      session.data.lang = 'en';
      await saveSession(phone, session);
      await ask('Okay Sir, switching to English. Let me ask again —');
      await reaskStep(phone, session, cat, d);
      return;
    }
    // new product question during order flow? check intent
    if (!/^(ha|hyan|yes|ok|thik|1|2|3)$/i.test(lower) && lower.length > 3) {
      let ni: Intent | null = null;
      try { ni = await extractIntent(msg, KEYWORD_PROMPT); } catch { /* ignore */ }
      if (ni && ['search', 'browse', 'price', 'delivery'].includes(ni.intent) && ni.keyword) {
        await clearSession(phone);
        await handleWaMessage(phone, msg, queueDepth);
        return;
      }
    }
    // price/total question about CURRENT order? answer it, don't treat as field data
    if (/\b(koto|koy|total|dam|price|cost)\b/i.test(lower) && d.product_id) {
      const product = cat.items.find((p) => p.id === d.product_id);
      if (product) {
        const qty = Number(d.quantity) || 1;
        const total = product.price * qty;
        await ask(effLang === 'bn'
          ? `Sir, ${product.name} এর দাম ${product.price} TK।\n${qty} pcs এর মোট: ${total} TK (ডেলিভারি চার্জ আলাদা)।`
          : `Sir, ${product.name} costs ${product.price} TK.\nTotal for ${qty} pcs: ${total} TK (delivery charge separate).`);
        pushHistory(session, 'ai', 'answered price mid-order');
        await saveSession(phone, session);
        await reaskStep(phone, session, cat, d);
        return;
      }
    }
  }

  switch (session.step) {
    case 'await_category_choice': {
      const cats = (session.shownIds ?? []) as string[];
      const idx = parseInt(msg) - 1;
      let chosenCat = cats[idx];
      // button tap: catchoose_0, catchoose_1...
      if (msg.startsWith('catchoose_')) {
        const bi = parseInt(msg.split('_')[1] ?? '-1');
        chosenCat = cats[bi];
      }
      // also match by name (fuzzy)
      if (!chosenCat) {
        const lower = msg.toLowerCase();
        chosenCat = cats.find((c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase())) ?? '';
      }
      if (!chosenCat) {
        await ask(effLang === 'bn'
          ? `Sir, 1-${cats.length} er moddhe number likhun, ba category nam bolun.`
          : `Sir, please reply 1-${cats.length}, or the category name.`);
        return;
      }
      const keyword = String(session.data.keyword ?? '');
      const catProducts = cat.items.filter((p) => p.category === chosenCat).slice(0, WA_CONFIG.maxProductsPerReply);
      if (catProducts.length === 0) {
        await ask(effLang === 'bn' ? 'Sir, ei category te ekhon product nei.' : 'Sir, no products in this category right now.');
        return;
      }
      for (const p of catProducts) {
        await waSendProductCard(phone, p, lang);
        await sleep(900);
      }
      await waSendButtons(
        phone,
        effLang === 'bn' ? 'Sir, konta nite chan? Tap korun:' : 'Sir, which one? Tap to select:',
        catProducts.map((p, i) => ({
          id: `prod_${p.id}`,
          title: `${i + 1}. ${smartCut(p.name, 17)}`,
        })),
      );
      pushHistory(session, 'ai', `shown ${catProducts.length} ${chosenCat} products`);
      session.step = 'await_product_choice';
      session.shownIds = catProducts.map((p) => p.id);
      await saveSession(phone, session);
      return;
    }
    case 'await_product_choice': {
      const idx = parseInt(msg) - 1;
      const prod = (session.shownIds ?? [])[idx] ? cat.items.find((p) => p.id === (session.shownIds ?? [])[idx]) : undefined;
      // also allow tapping list row id
      const byId = msg.startsWith('prod_') ? cat.items.find((p) => `prod_${p.id}` === msg) : undefined;
      const chosen = prod ?? byId;
      if (!chosen) {
        // not a choice — maybe a NEW question? detect and restart fresh
        let newIntent: Intent | null = null;
        try { newIntent = await extractIntent(msg, KEYWORD_PROMPT); } catch { /* ignore */ }
        if (newIntent && ['search', 'browse', 'price', 'delivery'].includes(newIntent.intent)) {
          session.step = 'idle';
          session.shownIds = [];
          await saveSession(phone, session);
          await handleWaMessage(phone, msg, queueDepth);
          return;
        }
        await ask(effLang === 'bn' ? 'Sir, 1, 2 ba 3 er moddhe ekti likhun.' : 'Sir, please reply 1, 2 or 3.');
        return;
      }
      d.product_id = chosen.id;
      // variant lazy: only if product HAS variants
      if (chosen.variants.length > 0) {
        const v = chosen.variants[0];
        session.step = 'await_variant';
        await saveSession(phone, session);
        await ask(effLang === 'bn'
          ? `Sir, "${chosen.name}" er ${v.name} gulo: ${v.options.map((o) => o.label).join(', ')}. Konta lagbe sir?`
          : `Sir, "${chosen.name}" options for ${v.name}: ${v.options.map((o) => o.label).join(', ')}. Which one, sir?`);
      } else {
        session.step = 'await_quantity';
        await saveSession(phone, session);
        await ask(effLang === 'bn' ? 'Sir, quantity koto pcs lagbe?' : 'Sir, how many pieces?');
      }
      return;
    }
    case 'await_variant': {
      d.variant = msg;
      session.step = 'await_quantity';
      await saveSession(phone, session);
      await ask(effLang === 'bn' ? 'Sir, quantity koto pcs lagbe?' : 'Sir, how many pieces?');
      return;
    }
    case 'await_quantity': {
      d.quantity = /^\d+$/.test(msg.trim()) ? msg.trim() : '1';
      session.step = 'await_name';
      await saveSession(phone, session);
      await ask(effLang === 'bn' ? 'Sir, apnar nam ta bolun.' : 'Sir, your name please.');
      return;
    }
    case 'await_name': {
      const name = msg.trim();
      if (name.length < 2 || name.length > 50) {
        await ask(effLang === 'bn' ? 'Sir, nam ta thik kore bolun.' : 'Sir, please tell me your name.');
        return;
      }
      d.name = name;
      session.step = 'await_address';
      await saveSession(phone, session);
      await ask(effLang === 'bn' ? 'Sir, full address ta din (basa/road, area, thana, district).' : 'Sir, your full address please (house/road, area, district).');
      return;
    }
    case 'await_address': {
      const addr = msg.trim();
      if (addr.length < 8) {
        await ask(effLang === 'bn' ? 'Sir, full address ta din (basa/road, area, thana, district).' : 'Sir, please give your full address (house/road, area, district).');
        return;
      }
      d.address = addr;
      session.step = 'await_phone';
      await saveSession(phone, session);
      await ask(effLang === 'bn' ? 'Sir, phone number ta diben.' : 'Sir, your phone number please.');
      return;
    }
    case 'await_phone': {
      const digits = msg.replace(/\D/g, '');
      // BD mobile: 11 digits starting with 01
      if (!/^01\d{9}$/.test(digits)) {
        await ask(effLang === 'bn'
          ? 'Sir, phone number ta thik ache na. 11 digit mobile number din (01 diye shuru).'
          : 'Sir, that number looks wrong. Please give your 11-digit mobile number (starts with 01).');
        return;
      }
      d.phone = digits;
      const product = cat.items.find((p) => p.id === d.product_id);
      session.step = 'await_confirm';
      await saveSession(phone, session);
      const qty = Number(d.quantity) || 1;
      const total = product ? product.price * qty : 0;
      const confirmText = effLang === 'bn'
        ? `Sir, confirm korchi:\n${product?.name ?? ''}${d.variant ? ` (${d.variant})` : ''}\nQuantity: ${qty} pcs\nTotal: ${total} TK (Cash on Delivery)\nNam: ${d.name}\nAddress: ${d.address}\nPhone: ${d.phone}`
        : `Sir, confirming:\n${product?.name ?? ''}${d.variant ? ` (${d.variant})` : ''}\nQty: ${qty} pcs\nTotal: ${total} TK (Cash on Delivery)\nName: ${d.name}\nAddress: ${d.address}\nPhone: ${d.phone}`;
      await waSendText(phone, confirmText);
      await waSendButtons(phone, effLang === 'bn' ? 'Thik ache sir?' : 'Correct, sir?', [
        { id: 'confirm_yes', title: effLang === 'bn' ? '✅ Order Confirm' : '✅ Confirm Order' },
        { id: 'confirm_no', title: effLang === 'bn' ? '❌ Cancel' : '❌ Cancel' },
      ]);
      return;
    }
    case 'await_confirm': {
      const isYes = msg === 'confirm_yes' || /^(ha|yes|y|hyan|thik|ok|confirm)/i.test(msg.trim());
      const isNo = msg === 'confirm_no';
      if (isYes) {
        const product = cat.items.find((p) => p.id === d.product_id);
        await waSendText(phone, pickWaiting('order', effLang));
        const ok = product ? await saveOrder(phone, d, product) : false;
        await clearSession(phone);
        await ask(ok
          ? (effLang === 'bn'
            ? 'Dhonnobad Sir! ✅ Apnar order confirm hoyeche. Amader team call kore confirm korbe. Hotline: 01333600272'
            : 'Thank you Sir! ✅ Your order is confirmed. Our team will call you to confirm. Hotline: 01333600272')
          : (effLang === 'bn'
            ? 'Sir, order save korte somossa hocche. Hotline 01333600272 te call korun.'
            : 'Sir, there was an issue saving your order. Please call 01333600272.'));
      } else {
        await clearSession(phone);
        await ask(effLang === 'bn' ? 'Thik ache Sir, order cancel kora holo. Abar proyojon hole janaben.' : 'Alright Sir, order cancelled. Let me know if you need anything.');
      }
      return;
    }
    default:
      await clearSession(phone);
  }
}
