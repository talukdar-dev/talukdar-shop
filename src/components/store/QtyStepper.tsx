'use client';

import { IconMinus, IconPlus } from './icons';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
}

export default function QtyStepper({ value, onChange, min = 1, max = 99, small = false }: Props) {
  const btn = small ? 'w-7 h-7' : 'w-9 h-10';
  const clamp = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="inline-flex items-stretch border border-gray-300 rounded-md overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => clamp(value - 1)}
        className={`${btn} flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-40`}
        disabled={value <= min}
      >
        <IconMinus className="w-4 h-4" />
      </button>
      <input
        type="number"
        aria-label="Quantity"
        className={`qty-input ${small ? 'w-9' : 'w-12'} text-center text-[14px] font-semibold outline-none border-x border-gray-300`}
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v)) clamp(v);
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => clamp(value + 1)}
        className={`${btn} flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-40`}
        disabled={value >= max}
      >
        <IconPlus className="w-4 h-4" />
      </button>
    </div>
  );
}
