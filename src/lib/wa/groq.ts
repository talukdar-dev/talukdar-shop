// Groq hybrid brain with strict rate limiting (never hit 429).
// - fast: openai/gpt-oss-20b  -> keyword/intent extraction (tiny prompts)
// - smart: openai/gpt-oss-120b -> final customer reply (max_tokens capped)
// Guards: 90% of free-tier RPM, in-memory sliding window per instance.

import { WA_CONFIG } from './config';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

// sliding window of call timestamps (ms)
let callTimes: number[] = [];
let dayTokens = 0;
let dayReset = Date.now();

function prune() {
  const now = Date.now();
  callTimes = callTimes.filter((t) => now - t < 60_000);
  if (now - dayReset > 24 * 60 * 60 * 1000) {
    dayTokens = 0;
    dayReset = now;
  }
}

// Wait until we're safely under 90% of the RPM limit
async function respectRateLimit() {
  prune();
  while (callTimes.length >= WA_CONFIG.maxRpm || dayTokens >= WA_CONFIG.maxTokensPerDay) {
    const oldest = callTimes[0] ?? Date.now();
    const wait = Math.max(0, 60_000 - (Date.now() - oldest) + 500);
    await new Promise((r) => setTimeout(r, Math.min(wait, 60_000)));
    prune();
    // safety: never loop forever
    if (callTimes.length === 0) break;
  }
}

interface GroqOpts {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  jsonMode?: boolean;
}

export async function groqChat(opts: GroqOpts): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  await respectRateLimit();
  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        temperature: 0.3,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      }),
    });
    callTimes.push(Date.now());
    if (res.status === 429) {
      // backoff: wait 30s, do NOT retry aggressively
      await new Promise((r) => setTimeout(r, 30_000));
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    // rough token accounting
    dayTokens += Math.ceil((opts.system.length + opts.user.length + text.length) / 4);
    return text.trim() || null;
  } catch {
    return null;
  }
}

export interface Intent {
  intent: string;
  keyword: string;
  lang: 'bn' | 'en';
}

export async function extractIntent(
  message: string,
  systemPrompt: string,
): Promise<Intent | null> {
  const raw = await groqChat({
    model: WA_CONFIG.groqModelFast,
    system: systemPrompt,
    user: message,
    maxTokens: 120,
    jsonMode: true,
  });
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return {
      intent: String(p.intent || 'other'),
      keyword: String(p.keyword || ''),
      lang: p.lang === 'en' ? 'en' : 'bn',
    };
  } catch {
    return null;
  }
}

export async function finalReply(
  systemPrompt: string,
  customerMsg: string,
): Promise<string | null> {
  return groqChat({
    model: WA_CONFIG.groqModelSmart,
    system: systemPrompt,
    user: customerMsg,
    maxTokens: 250,
  });
}
