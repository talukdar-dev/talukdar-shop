'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/admin/UI';

interface ChatSummary {
  phone: string;
  name?: string;
  count: number;
  lastText: string;
  lastAt: number;
  lastDir: string;
}

interface ChatMsg {
  d: 'in' | 'out';
  t: string;
  at: number;
}

function fmtTime(ts: number) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) return time;
  return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ', ' + time;
}

function displayName(c: ChatSummary) {
  if (c.name) return c.name;
  // BSUID like BD.1074370902101691 → show shortened
  if (/^[A-Z]{2}\.\d+$/.test(c.phone)) return `User ${c.phone.slice(-4)}`;
  return c.phone;
}

export default function WhatsAppChatsPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ChatSummary | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [chatName, setChatName] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-chats', { cache: 'no-store' });
      const data = await res.json();
      setChats(data.chats ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  const openChat = useCallback(async (c: ChatSummary) => {
    setActive(c);
    setMsgsLoading(true);
    setChatName('');
    try {
      const res = await fetch(`/api/admin/whatsapp-chats/${encodeURIComponent(c.phone)}`, { cache: 'no-store' });
      const data = await res.json();
      setMsgs(data.messages ?? []);
      setChatName(data.name ?? '');
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const sendManual = useCallback(async () => {
    if (!active || !draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      const res = await fetch('/api/admin/whatsapp-chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: active.phone, text }),
      });
      const data = await res.json();
      if (data.ok) {
        // append locally for instant feedback
        setMsgs((m) => [...m, { d: 'out', t: text, at: Date.now() }]);
      } else {
        setDraft(text); // restore on failure
        alert('পাঠানো যায়নি, আবার চেষ্টা করুন');
      }
    } catch {
      setDraft(text);
      alert('পাঠানো যায়নি, আবার চেষ্টা করুন');
    } finally {
      setSending(false);
    }
  }, [active, draft, sending]);

  const activeName = chatName || (active ? displayName(active) : '');

  return (
    <div className="overflow-hidden rounded-xl shadow-2xl" style={{ background: '#0b141a' }}>
      {/* WA header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#1f2c34' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: '#00a884' }}>
          {active ? activeName.charAt(0).toUpperCase() : '💬'}
        </div>
        <div className="flex-1">
          <p className="text-base font-medium text-white">{active ? activeName : 'WhatsApp Chats'}</p>
          <p className="text-xs" style={{ color: '#8696a0' }}>
            {active ? (active.phone + ' • view only') : `${chats.length} conversations`}
          </p>
        </div>
        {active && (
          <button
            onClick={() => { setActive(null); setDraft(''); loadChats(); }}
            className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#00a884' }}
          >
            ← All Chats
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !active ? (
        /* conversation list — WA style */
        <div style={{ background: '#0b141a' }}>
          {chats.length === 0 && (
            <p className="p-8 text-center text-sm" style={{ color: '#8696a0' }}>
              No chats yet. Conversations will appear here once customers message the bot.
            </p>
          )}
          {chats.map((c) => (
            <button
              key={c.phone}
              onClick={() => openChat(c)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              style={{ borderBottom: '1px solid #1f2c34' }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: '#2a3942' }}
              >
                {displayName(c).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[15px] font-medium text-white">{displayName(c)}</p>
                  <span className="shrink-0 text-xs" style={{ color: c.lastDir === 'in' ? '#00a884' : '#8696a0' }}>
                    {fmtTime(c.lastAt)}
                  </span>
                </div>
                <p className="truncate text-sm" style={{ color: '#8696a0' }}>
                  {c.lastDir === 'out' ? '✓✓ ' : ''}{c.lastText || '—'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* chat thread — WA style */
        <div
          className="flex flex-col"
          style={{
            background: '#0b141a',
            backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            minHeight: '60vh',
            maxHeight: '75vh',
          }}
        >
          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
            {msgsLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : msgs.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: '#8696a0' }}>No messages yet</p>
            ) : (
              msgs.map((m, i) => (
                <div key={i} className={`flex ${m.d === 'out' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-lg px-2.5 py-1.5 text-[14.5px] leading-snug text-white shadow"
                    style={{ background: m.d === 'out' ? '#005c4b' : '#1f2c34' }}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.t}</p>
                    <p className="mt-0.5 text-right text-[11px]" style={{ color: m.d === 'out' ? '#8fd3c7' : '#8696a0' }}>
                      {fmtTime(m.at)}{m.d === 'out' ? ' ✓✓' : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          {/* manual reply input */}
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#1f2c34' }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendManual(); }}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2.5 text-[14.5px] text-white outline-none placeholder:text-gray-500"
              style={{ background: '#2a3942' }}
              maxLength={4000}
            />
            <button
              onClick={sendManual}
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
              style={{ background: '#00a884' }}
              aria-label="Send"
            >
              {sending ? '…' : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <div className="px-4 py-1.5 text-center text-[11px]" style={{ background: '#1f2c34', color: '#8696a0' }}>
            You are replying as Talukdar Shop
          </div>
        </div>
      )}
    </div>
  );
}
