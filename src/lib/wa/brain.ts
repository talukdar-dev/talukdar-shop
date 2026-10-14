// Brain orchestrator: 120B understands -> 20B finds data -> 120B writes reply.
// The 120B is the brain: it interprets every customer message in context.
// The 20B is the finder: fast structured extraction and product ranking.

import { groqChat, extractJsonLenient } from './groq';
import { WA_CONFIG } from './config';

export interface BrainDecision {
  action:
    | 'greeting'
    | 'search'
    | 'category_ask'
    | 'product_info'
    | 'price_ask'
    | 'delivery_info'
    | 'order_start'
    | 'order_data'
    | 'order_cancel'
    | 'human'
    | 'clarify'
    | 'other';
  keyword: string;
  lang: 'bn' | 'en';
  understanding: string;
  confidence: 'high' | 'medium' | 'low';
  clarifyQuestion?: string;
  // order-related extracted fields (when action is order_data)
  orderFields?: { name?: string; address?: string; phone?: string; quantity?: string };
}

const BRAIN_SYSTEM = `You are the brain of Talukdar Shop's WhatsApp salesman. Talukdar Shop sells home appliances in Bangladesh (fan, air fryer, rice cooker, geyser, heater, light, IPS, solar, etc.). Cash on Delivery only.

Given the conversation history and the customer's latest message, UNDERSTAND what they mean and decide the next action.

Reply ONLY with JSON, no other text:
{"action":"...","keyword":"...","lang":"bn|en","understanding":"...","confidence":"high|medium|low","clarifyQuestion":"...","orderFields":{...}}

Actions:
- "greeting": hi/hello/salam only
- "search": customer wants to find/see/buy a product. keyword = product in English (e.g. "room heater", "ceiling fan")
- "category_ask": customer picked a category/type from options
- "product_info": asking details about a specific product shown
- "price_ask": asking price of something
- "delivery_info": asking delivery charge/time/location
- "order_start": wants to order/buy ("order korbo", "nibo", "kinbo", tapped a product)
- "order_data": customer is giving order details (name/address/phone/quantity) in ANY form — extract into orderFields. Even partial info.
- "order_cancel": customer does NOT want to order ("order korbo na", "lagbe na", "cancel", "bad den", "thak")
- "human": wants to talk to a human/agent
- "clarify": you are NOT sure what they want — set confidence "low" and write a clarifying question
- "other": anything else

Rules:
- lang: "bn" if customer wrote Bengali script OR Banglish (Latin-script Bangla like "dam koto", "order korbo na"), else "en".
- understanding: one line on what the customer means, in English.
- confidence: "high" if clear, "medium" if probable, "low" if vague/confusing (e.g. "eta", "oita", "dam koto" with no product context).
- If confidence is "low" -> action MUST be "clarify" with a helpful clarifyQuestion.
- NEVER guess when unsure. Better to ask than to show wrong products.
- orderFields: extract name/address/phone/quantity whenever the customer provides them, even casually ("amar nam Shipon", "address Dhaka Uttara", "phone 017...").
- If customer cancels mid-order -> "order_cancel", NOT order_data.
- If customer asks a new product question mid-order -> "search" with keyword.
- "Bangla bolo" / "English bolo" -> "other" with understanding "wants language switch to Bangla/English".
- NEVER treat a cancellation or question as order data.`;

export async function brainUnderstand(
  msg: string,
  history: string[],
): Promise<BrainDecision | null> {
  const histText = history.length ? `Conversation so far:\n${history.join('\n')}\n\n` : '';
  const raw = await groqChat({
    model: WA_CONFIG.groqModelSmart, // 120B = the brain
    system: BRAIN_SYSTEM,
    user: `${histText}Customer just said: ${msg}`,
    maxTokens: 300,
  });
  if (!raw) return null;
  const p = extractJsonLenient(raw);
  if (!p || typeof p !== 'object') return null;
  const d = p as Record<string, unknown>;
  const validActions = [
    'greeting', 'search', 'category_ask', 'product_info', 'price_ask',
    'delivery_info', 'order_start', 'order_data', 'order_cancel', 'human', 'clarify', 'other',
  ];
  const action = validActions.includes(String(d.action)) ? (d.action as BrainDecision['action']) : 'other';
  const conf = String(d.confidence ?? 'medium');
  const of = d.orderFields as Record<string, unknown> | undefined;
  return {
    action,
    keyword: String(d.keyword ?? ''),
    lang: d.lang === 'en' ? 'en' : 'bn',
    understanding: String(d.understanding ?? ''),
    confidence: conf === 'high' ? 'high' : conf === 'low' ? 'low' : 'medium',
    clarifyQuestion: d.clarifyQuestion ? String(d.clarifyQuestion) : undefined,
    orderFields: of && typeof of === 'object' ? {
      name: of.name ? String(of.name) : undefined,
      address: of.address ? String(of.address) : undefined,
      phone: of.phone ? String(of.phone) : undefined,
      quantity: of.quantity ? String(of.quantity) : undefined,
    } : undefined,
  };
}

// ---- 20B finder: rank product candidates, pick best 3 ----
export interface RankedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  category: string;
  reason?: string;
}

const FINDER_SYSTEM = `You rank products for a customer search. Reply ONLY with JSON, no other text:
{"picks":["id1","id2","id3"]}
Pick up to 3 best matches for the keyword. Prefer exact category/name matches, in-stock items first.`;

export async function finderRank(
  keyword: string,
  candidates: Array<{ id: string; name: string; category: string; price: number; stock: number }>,
): Promise<string[]> {
  if (candidates.length <= 3) return candidates.map((c) => c.id);
  const list = candidates
    .slice(0, 12)
    .map((c) => `- id:${c.id} | ${c.name} | cat:${c.category} | ${c.price}TK | ${c.stock > 0 ? 'in-stock' : 'out'}`)
    .join('\n');
  const raw = await groqChat({
    model: WA_CONFIG.groqModelFast, // 20B = the finder
    system: FINDER_SYSTEM,
    user: `Keyword: "${keyword}"\nProducts:\n${list}`,
    maxTokens: 100,
  });
  if (!raw) return candidates.slice(0, 3).map((c) => c.id);
  const p = extractJsonLenient(raw);
  const picks = (p as { picks?: unknown })?.picks;
  if (Array.isArray(picks) && picks.length > 0) {
    const valid = picks.map(String).filter((id) => candidates.some((c) => c.id === id));
    if (valid.length > 0) return valid.slice(0, 3);
  }
  return candidates.slice(0, 3).map((c) => c.id);
}

// ---- 120B writer: beautiful natural reply ----
export async function brainWriteReply(opts: {
  lang: 'bn' | 'en';
  customerMsg: string;
  understanding: string;
  dataText: string; // products found / order status / etc, or empty
  instruction: string; // what this reply should do
  history: string[];
}): Promise<string | null> {
  const { lang, customerMsg, understanding, dataText, instruction, history } = opts;
  const histText = history.length ? `Recent chat:\n${history.slice(-4).join('\n')}\n\n` : '';
  const langRule = lang === 'bn' ? 'Write in pure Bengali script (বাংলা অক্ষরে).' : 'Write in pure English.';
  return groqChat({
    model: WA_CONFIG.groqModelSmart, // 120B = the writer
    system: `You are a polite salesman for Talukdar Shop (Bangladesh home appliances). Address customer as Sir, respectful tone. ${langRule}
Rules: WhatsApp style, SHORT (1-4 lines). No markdown (** forbidden). Max one natural emoji. Never invent prices/stock. COD only. Delivery: Dhaka 60TK, outside 120TK, free above 5000TK. Hotline 01333600272.`,
    user: `${histText}Customer said: "${customerMsg}"\nWhat they mean: ${understanding}\n${dataText ? `Data:\n${dataText}\n` : ''}Your task: ${instruction}\nReply:`,
    maxTokens: 300,
  });
}
