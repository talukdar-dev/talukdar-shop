'use client';

import { useEffect, useState } from 'react';

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="min-w-[52px] px-2 py-1.5 bg-navy text-white text-[18px] font-black rounded-md text-center tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-ink mt-1">{label}</span>
    </span>
  );
}

/** Client-only countdown — the product cards are server-rendered by the parent. */
export function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = now === null ? 0 : Math.max(0, new Date(endsAt).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <span className="flex items-center gap-2">
      <span className="text-[13px] font-semibold text-gray-700 mr-1">Offer Ending In:</span>
      <TimeBox value={pad(d)} label="Days" />
      <span className="text-[18px] font-black text-navy -mt-5">:</span>
      <TimeBox value={pad(h)} label="Hours" />
      <span className="text-[18px] font-black text-navy -mt-5">:</span>
      <TimeBox value={pad(m)} label="Mins" />
      <span className="text-[18px] font-black text-navy -mt-5">:</span>
      <TimeBox value={pad(s)} label="Secs" />
    </span>
  );
}
