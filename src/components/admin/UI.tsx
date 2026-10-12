'use client';

// Shared admin UI primitives — no emojis, inline SVG only.

import React, { useRef, useState } from 'react';
import { cloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';

/* ---------- notice: Supabase not connected ---------- */
export function DbNotice() {
  return (
    <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Database not connected — admin writes are disabled in demo mode.</p>
      <p className="mt-1">
        Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
        <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
        <code className="rounded bg-amber-100 px-1">.env.local</code> to enable saving changes.
        Reading data works from the built-in demo catalog.
      </p>
    </div>
  );
}

/* ---------- page header ---------- */
export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500 break-words">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ---------- data table ---------- */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyText = 'No records found.',
}: {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
}) {
  if (rows.length === 0) return <EmptyState text={emptyText} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- form fields ---------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ''}`} rows={props.rows ?? 3} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </button>
  );
}

/* ---------- buttons ---------- */
export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

/** Two-step confirm delete button */
export function ConfirmButton({
  onConfirm,
  label = 'Delete',
}: {
  onConfirm: () => void | Promise<void>;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setArmed(false);
          }
        }}
        className="rounded-lg bg-red-600 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? '…' : 'Confirm'}
      </button>
      <button
        onClick={() => setArmed(false)}
        className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
      >
        Cancel
      </button>
    </span>
  );
}

/* ---------- badge ---------- */
const badgeColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};

export function Badge({ text }: { text: string }) {
  const cls = badgeColors[text.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

/* ---------- empty state / spinner ---------- */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10V11m0 10l-8-4m8 4l8-4V7m-8 4L4 7" />
      </svg>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="h-8 w-8 animate-spin text-blue-700" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
}

/* ---------- image upload ---------- */
export function ImageUpload({
  value,
  onChange,
  label = 'Image',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const configured = cloudinaryConfigured();

  async function handleFile(file: File) {
    setError('');
    if (!configured) {
      setError('Cloudinary is not configured — paste an image URL below instead.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload file'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="…or paste image URL"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  onChange(urlInput.trim());
                  setUrlInput('');
                }
              }}
              className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Use URL
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- multi image upload ---------- */
export function MultiImageUpload({
  values,
  onChange,
  label = 'Images',
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const configured = cloudinaryConfigured();

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError('');
    if (!configured) {
      setError('Cloudinary is not configured — paste image URLs instead.');
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(fileList)) {
        const url = await uploadToCloudinary(file);
        urls.push(url);
      }
      onChange([...values, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="mb-2 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !configured}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload images'}
        </button>
        {!configured && (
          <span className="text-xs text-amber-600">Cloudinary not configured — use URLs below</span>
        )}
      </div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {values.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`image ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {i > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = [...values];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  onChange(next);
                }}
                className="absolute bottom-1 left-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                aria-label="Move left"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste URL"
            className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs focus:border-blue-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                onChange([...values, urlInput.trim()]);
                setUrlInput('');
              }
            }}
            className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
          >
            Add URL
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {configured
          ? 'Upload images from your phone/computer, or paste any image URL below.'
          : 'Cloudinary not configured — paste image URLs.'}
      </p>
    </div>
  );
}
