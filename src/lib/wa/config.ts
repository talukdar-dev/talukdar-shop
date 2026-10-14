// Talukdar Shop WhatsApp AI Sales Agent — shared config.
// Tone: respectful Sir/Apni. Language: match customer (Bangla script / English).
// Minimal emojis (0-1 natural), NO markdown (** etc) — plain human WhatsApp text.

export const WA_CONFIG = {
  groqModelFast: 'openai/gpt-oss-20b',
  groqModelSmart: 'openai/gpt-oss-120b',
  // Groq free-tier guards — stay under 90%, never hit 429
  maxRpm: 27, // 90% of 30
  maxTokensPerDay: 180000, // 90% of 200K
  maxProductsPerReply: 3,
  cacheTtlMs: 5 * 60 * 1000,
  sessionTtlMs: 30 * 60 * 1000,
} as const;

// ---- Shop knowledge (agent training) ----
export const SHOP_INFO = {
  name: 'Talukdar Shop',
  hotline: '01333600272',
  hotlineHours: 'প্রতিদিন সকাল ৯টা – রাত ১০টা',
  address: 'Kalmegha, Sakhipur, Tangail',
  deliveryInsideDhaka: 60,
  deliveryOutsideDhaka: 120,
  freeShippingOver: 5000,
  payment: 'Cash on Delivery',
  // Strengths distilled from verified customer reviews
  strengths: [
    '100% genuine products with official warranty',
    'Fast delivery inside and outside Dhaka',
    'Careful packaging',
    'Best price in Bangladesh with EMI facility',
    'Customers say they would buy again and recommend to others',
  ],
} as const;

// ---- Waiting message pools (rotated by context, always personal) ----
export const WAITING_POOL_BN: Record<string, string[]> = {
  search: [
    'Sir, apnar jonno dekhe aschi, ektu opekkha korun',
    'Sir, best option ta khujchi apnar jonno',
    'Sir, dam ar stock miliye dekhchi apnar jonno',
  ],
  stock: [
    'Sir, stock ta confirm kore janacchi',
    'Sir, ektu opekkha korun, stock check korchi apnar jonno',
  ],
  order: [
    'Sir, apnar order ta ready korchi',
    'Sir, details ta miliye nicchi apnar jonno',
  ],
  general: [
    'Sir, sothik tothyo niye aschi, ektu somoy din',
    'Sir, ektu opekkha korun, dekhe janacchi',
  ],
};

export const WAITING_POOL_EN: Record<string, string[]> = {
  search: [
    'Sir, looking for the best option for you, please wait a moment',
    'Sir, checking price and stock for you',
  ],
  stock: ['Sir, confirming stock for you'],
  order: ['Sir, preparing your order'],
  general: ['Sir, getting the right information for you, one moment'],
};

export function pickWaiting(kind: string, lang: 'bn' | 'en'): string {
  const pool = (lang === 'bn' ? WAITING_POOL_BN : WAITING_POOL_EN)[kind]
    ?? (lang === 'bn' ? WAITING_POOL_BN.general : WAITING_POOL_EN.general);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---- Greetings (no DB call needed) ----
export const GREETINGS = new Set([
  'hi', 'hello', 'hey', 'salam', 'assalamualaikum', 'assalamu alaikum',
  'adab', 'good morning', 'good evening', 'hey sir',
]);

export const GREETING_REPLY_BN =
  'Walaikum Assalam Sir! Talukdar Shop-e apnake swagotom. Ki product khujchen sir? Air fryer, rice cooker, fan, geyser — bolun, ami ber kore dicchi.';
export const GREETING_REPLY_EN =
  'Hello Sir! Welcome to Talukdar Shop. Which product are you looking for? Air fryer, rice cooker, fan, geyser — just tell me.';

// ---- Language detect: Bengali script or Banglish -> bn, else en ----
export function detectLang(text: string): 'bn' | 'en' {
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  // common Banglish markers (expanded)
  if (/\b(lagbe|lagbo|dam|dham|koto|koyta|ache|achen|nai|nei|chai|chailam|chay|kinte|kinbo|nibo|nite|nita|dokan|valo|bhalo|khujchi|khujchi|bolun|bolo|bolen|din|den|dao|daw|dili|dilen|diben|dibo|kore|koren|koro|korbo|theke|agula|egula|ogula|eita|oita|eigula|kivabe|kemne|kemon|hobe|hbe|tumi|toi|tui|ami|amake|amar|apni|apnar|ekta|duita|tinta|koi|kothay|kobe|keno|karon|kintu|jodi|tobe|akhon|ekhon|pore|age|abar|shudhu|sudhu|eto|oto|khub|onek|kom|beshi|choto|boro|notun|dekhte|dekhbo|dekhao|dekhano|nite|pathao|order|delivery|taka|tk)\b/i.test(text)) return 'bn';
  return 'en';
}

// ---- System prompts ----
export const KEYWORD_PROMPT = `You are a keyword extractor for Talukdar Shop, a Bangladesh home appliance store.
Customer message may have spelling mistakes, Banglish, or Bengali script.
Reply ONLY with JSON, no other text:
{"intent":"greeting|browse|search|variant|price|delivery|order|other","keyword":"product keyword in english or empty","lang":"bn|en"}
RULES:
- Single product/category word (fan, fridge, iron, cooker) -> intent "search" with that keyword. NEVER "browse" for a product word.
- "browse" ONLY for vague messages like "ki ki ache", "what do you have", "dekhte chai".
- Complaints about previous reply ("egula ki dili", "eta na") -> intent "search", use the product from context if mentioned.
Appliance categories: air fryer, iron, rice cooker, electric kettle, fan, ceiling fan, rechargeable fan, solar, water heater, geyser, light, battery, ips, infrared cooker, blender, mixer grinder, multi cooker, pressure cooker, cookware, microwave oven, room heater.
Examples:
"air fryer lagbe" -> {"intent":"search","keyword":"air fryer","lang":"bn"}
"fan" -> {"intent":"search","keyword":"fan","lang":"en"}
"Fan chai" -> {"intent":"search","keyword":"fan","lang":"bn"}
"geyser er dam koto" -> {"intent":"price","keyword":"geyser","lang":"bn"}
"ki ki ache" -> {"intent":"browse","keyword":"","lang":"bn"}
"chailam fan egula ki dili" -> {"intent":"search","keyword":"fan","lang":"bn"}
"hi" -> {"intent":"greeting","keyword":"","lang":"en"}
"1 number ta nibo" -> {"intent":"order","keyword":"","lang":"bn"}`;

export function finalReplyPrompt(opts: {
  lang: 'bn' | 'en';
  customerMsg: string;
  products: Array<{ name: string; price: number; stock: number }>;
  context: string;
}): string {
  const { lang, customerMsg, products, context } = opts;
  const prodList = products.map((p, i) => `${i + 1}. ${p.name}\n   ${p.price} TK${p.stock > 0 ? '' : ' (stock sesh)'}`).join('\n\n');
  const langRule = lang === 'bn'
    ? 'Reply in pure Bengali script (বাংলা অক্ষরে).'
    : 'Reply in pure English.';
  return `You are a polite salesman for Talukdar Shop, Bangladesh home appliance store.
Rules (strict):
- Address as Sir, respectful Apni tone. ${langRule}
- Keep it SHORT: 1-3 lines, WhatsApp style.
- NEVER use ** or any markdown. Plain text only.
- Max ONE natural emoji, or none. No decorative emoji sequences.
- Only use the product data given. Never invent prices or stock.
- Payment is Cash on Delivery only. Delivery: Dhaka 60 TK, outside Dhaka 120 TK, free above 5000 TK.
- If asked about delivery/time: inside Dhaka 2-3 days, outside 3-5 days. Hotline 01333600272 (9AM-10PM).
- FORMAT: when listing products, put EACH product on its own block with a blank line between. Easy to scan at a glance.
Example:
Sir, 3 ta pelam:

1. Defender ST-2912 Fan
   3499 TK

2. Ceiling Fan 56 Inch
   3500 TK

Konta nite chan? Number likhun.
Shop strengths (mention naturally when relevant): 100% genuine products, official warranty, fast delivery, careful packaging, best price.
Products:
${prodList || '(none)'}
Context: ${context}
Customer: ${customerMsg}
Reply:`;
}
