'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader, Spinner } from '@/components/admin/UI';

interface ChatSummary {
  phone: string;
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

function timeStr(ts: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function WhatsAppChatsPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
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

  const openChat = useCallback(async (phone: string) => {
    setActive(phone);
    setMsgsLoading(true);
    try {
      const res = await fetch(`/api/admin/whatsapp-chats/${encodeURIComponent(phone)}`, { cache: 'no-store' });
      const data = await res.json();
      setMsgs(data.messages ?? []);
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  return (
    <div>
      <PageHeader title="WhatsApp Chats" sub="Customer ↔ AI agent conversations" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : chats.length === 0 ? (
        <p className="rounded-lg bg-slate-800 p-6 text-center text-sm text-slate-400">
          No chats yet. Conversations will appear here once customers message the WhatsApp bot.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* conversation list */}
          <div className="overflow-hidden rounded-lg bg-slate-800">
            <div className="border-b border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Conversations ({chats.length})
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {chats.map((c) => (
                <button
                  key={c.phone}
                  onClick={() => openChat(c.phone)}
                  className={`block w-full border-b border-slate-700/50 px-4 py-3 text-left transition-colors ${
                    active === c.phone ? 'bg-blue-900/40' : 'hover:bg-slate-700/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-100">{c.phone}</span>
                    <span className="text-xs text-slate-500">{timeStr(c.lastAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {c.lastDir === 'in' ? '👤 ' : '🤖 '}{c.lastText || '—'}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                    {c.count} msgs
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* message thread */}
          <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-lg bg-slate-800">
            {!active ? (
              <p className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
                Select a conversation to view messages
              </p>
            ) : msgsLoading ? (
              <div className="flex flex-1 items-center justify-center"><Spinner /></div>
            ) : (
              <>
                <div className="border-b border-slate-700 px-4 py-2 text-sm font-medium text-slate-200">
                  {active}
                  <button onClick={loadChats} className="ml-3 text-xs text-blue-400 hover:text-blue-300">
                    ↻ refresh
                  </button>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {msgs.map((m, i) => (
                    <div key={i} className={`flex ${m.d === 'out' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          m.d === 'out'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.t}</p>
                        <p className={`mt-1 text-right text-[10px] ${m.d === 'out' ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
