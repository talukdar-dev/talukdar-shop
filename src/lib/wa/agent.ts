// True conversational agent — like ChatGPT/Gemini.
// The 120B model has FULL control: it thinks, uses tools, and replies naturally.
// No rigid state machine. The brain decides everything.

import { groqChat, extractJsonLenient } from './groq';
import { WA_CONFIG } from './config';
import type { CatProduct } from './flow';

export interface AgentToolResult {
  tool: string;
  result: string;
}

export interface AgentContext {
  products: CatProduct[];
  history: string[];
  sessionData: Record<string, string | number>;
}

const AGENT_SYSTEM = `You are a smart salesman for Talukdar Shop, a Bangladesh home appliance store. You are like ChatGPT — you deeply understand the customer, remember the conversation, and never make dumb mistakes.

You think step by step, use tools when needed, then reply naturally.

TOOLS (use when needed):
- search_products: {"tool":"search_products","keyword":"..."} — find products
- product_details: {"tool":"product_details","id":"..."} — full details of one product
- calculate_total: {"tool":"calculate_total","price":4500,"qty":2} — total + delivery estimate
- save_order: {"tool":"save_order","product_id":"...","name":"...","address":"...","phone":"...","quantity":"2"} — place COD order
- delivery_info: {"tool":"delivery_info"} — delivery charges and timing

Shop facts: Cash on Delivery only. Dhaka delivery 60 TK (2-3 days), outside Dhaka 120 TK (3-5 days), free above 5000 TK. Hotline 01333600272 (9AM-10PM). Address: Kalmegha, Sakhipur, Tangail.

Reply with JSON ONLY:
{"thought":"your reasoning about what the customer wants","tool":null or {"tool":"...","...params"},"reply":"your natural reply to customer, or null if you need tool result first"}

CRITICAL RULES:
- When customer asks about ANY product (search, price, availability), you MUST call the search_products tool FIRST. NEVER answer from memory alone — the tool triggers product images and tap buttons.
- ALWAYS think first. Understand deeply before acting.
- Use conversation history. If customer said "eta" / "oita" / "dam koto", look at history for context.
- NEVER treat a question as an answer. "Koto tk?" is asking price, not giving data.
- NEVER treat cancellation as data. "Order korbo na" = cancel, not an address.
- If unsure, ask a clarifying question in the reply. Never guess products.
- Reply in the customer's language.
- LANGUAGE IS STRICT: If customer wrote Bengali script (বাংলা) OR Banglish (Latin-script Bangla like "dam koto", "pressure cooker ase"), you MUST reply in pure Bengali Unicode script (বাংলা অক্ষরে). NEVER reply in Banglish/Latin script for Bengali. Example: customer "R ki ki ase" → you reply "স্যার, আমাদের..." (Bengali script), NOT "Sir, amader..." (Banglish).
- If customer wrote English, reply in English.
- WhatsApp style: short, warm, respectful (Sir/Apni). No markdown. Max 1 emoji.
- When showing products, list each on its own line with price.
- Collect order details naturally in conversation (don't interrogate). If they give name+address together, accept both.
- Validate phone: must be 11 digits starting with 01. If wrong, ask again politely.
- Before save_order, confirm all details with customer and get yes.
- If customer wants human, give hotline 01333600272.`;

export interface AgentStep {
  thought: string;
  tool: Record<string, unknown> | null;
  reply: string | null;
}

export async function agentThink(
  customerMsg: string,
  ctx: AgentContext,
  toolResults: AgentToolResult[],
): Promise<AgentStep | null> {
  const productCatalog = ctx.products
    .slice(0, 40)
    .map((p) => `- id:${p.id} | ${p.name} | ${p.price}TK | cat:${p.category} | ${p.stock > 0 ? 'in-stock' : 'out'}`)
    .join('\n');

  const historyText = ctx.history.length ? `Conversation:\n${ctx.history.join('\n')}\n\n` : '';
  const sessionText = Object.keys(ctx.sessionData).length
    ? `Order in progress: ${JSON.stringify(ctx.sessionData)}\n\n`
    : '';
  const toolsText = toolResults.length
    ? `Tool results so far:\n${toolResults.map((t) => `${t.tool}: ${t.result}`).join('\n')}\n\n`
    : '';

  const raw = await groqChat({
    model: WA_CONFIG.groqModelSmart,
    system: AGENT_SYSTEM,
    user: `${historyText}${sessionText}${toolsText}Available products:\n${productCatalog}\n\nCustomer just said: "${customerMsg}"\n\nThink and respond with JSON:`,
    maxTokens: 600,
  });
  if (!raw) return null;
  const p = extractJsonLenient(raw);
  if (!p) return null;
  return {
    thought: String(p.thought ?? ''),
    tool: (p.tool as Record<string, unknown> | null) ?? null,
    reply: p.reply ? String(p.reply) : null,
  };
}

// Execute a tool call from the agent
export async function agentExecTool(
  tool: Record<string, unknown>,
  ctx: AgentContext,
): Promise<AgentToolResult> {
  const name = String(tool.tool ?? '');
  try {
    if (name === 'search_products') {
      const kw = String(tool.keyword ?? '').toLowerCase();
      const matches = ctx.products
        .filter((p) =>
          p.name.toLowerCase().includes(kw) ||
          p.category.toLowerCase().includes(kw) ||
          kw.split(/\s+/).some((w) => w.length > 2 && (p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w))),
        )
        .slice(0, 5);
      return {
        tool: name,
        result: matches.length
          ? matches.map((p) => `id:${p.id} | ${p.name} | ${p.price}TK | ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}`).join('\n')
          : 'No products found',
      };
    }
    if (name === 'product_details') {
      const p = ctx.products.find((x) => x.id === String(tool.id));
      return {
        tool: name,
        result: p
          ? `${p.name} | Price: ${p.price}TK | Category: ${p.category} | Brand: ${p.brand} | Stock: ${p.stock > 0 ? p.stock + ' pcs' : 'out of stock'}`
          : 'Product not found',
      };
    }
    if (name === 'calculate_total') {
      const price = Number(tool.price) || 0;
      const qty = Number(tool.qty) || 1;
      const subtotal = price * qty;
      // delivery unknown until address — give estimate range
      return {
        tool: name,
        result: `Subtotal: ${subtotal}TK for ${qty} pcs. Delivery: 60TK (Dhaka) / 120TK (outside) / free above 5000TK.`,
      };
    }
    if (name === 'delivery_info') {
      return {
        tool: name,
        result: 'COD only. Inside Dhaka: 60TK, 2-3 days. Outside Dhaka: 120TK, 3-5 days. Free delivery above 5000TK.',
      };
    }
    // save_order is handled by the caller (needs DB + session)
    if (name === 'save_order') {
      return { tool: name, result: 'PENDING_CONFIRMATION:' + JSON.stringify(tool) };
    }
    return { tool: name, result: 'Unknown tool' };
  } catch (e) {
    return { tool: name, result: 'Tool error: ' + String(e).slice(0, 100) };
  }
}
