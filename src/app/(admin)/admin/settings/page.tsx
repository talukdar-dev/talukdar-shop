'use client';

import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';
import {
  DbNotice, Field, ImageUpload, PageHeader, PrimaryButton, Spinner, TextArea, TextInput, Toggle,
} from '@/components/admin/UI';

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        const data = await res.json();
        setDemo(data.dbConfigured === false);
        if (data.settings) setForm(data.settings);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k: keyof SiteSettings, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setDemo(!!data.demo);
        setMsg(data.error || 'Save failed');
      } else {
        setMsg('Settings saved successfully.');
      }
    } catch {
      setMsg('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Settings"
        sub="Every editable piece of the storefront"
        actions={<PrimaryButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</PrimaryButton>}
      />
      {msg && (
        <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Store identity</h2>
          <div className="grid gap-4">
            <Field label="Site name"><TextInput value={form.site_name ?? ''} onChange={(e) => set('site_name', e.target.value)} /></Field>
            <Field label="Tagline"><TextInput value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
            <ImageUpload label="Logo" value={form.logo ?? ''} onChange={(u) => set('logo', u)} />
            <Field label="Currency symbol"><TextInput value={form.currency ?? ''} onChange={(e) => set('currency', e.target.value)} /></Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h2>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hotline"><TextInput value={form.hotline ?? ''} onChange={(e) => set('hotline', e.target.value)} /></Field>
              <Field label="Hotline hours"><TextInput value={form.hotline_hours ?? ''} onChange={(e) => set('hotline_hours', e.target.value)} /></Field>
            </div>
            <Field label="Email"><TextInput value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Address"><TextArea value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Facebook URL"><TextInput value={form.facebook ?? ''} onChange={(e) => set('facebook', e.target.value)} /></Field>
              <Field label="YouTube URL"><TextInput value={form.youtube ?? ''} onChange={(e) => set('youtube', e.target.value)} /></Field>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Announcement bar</h2>
          <div className="grid gap-4">
            <Field label="Announcement text"><TextInput value={form.announcement ?? ''} onChange={(e) => set('announcement', e.target.value)} /></Field>
            <Field label="Announcement link"><TextInput value={form.announcement_link ?? ''} onChange={(e) => set('announcement_link', e.target.value)} placeholder="/offers" /></Field>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inside Dhaka (৳)">
              <TextInput type="number" min={0} value={form.inside_dhaka_shipping ?? 0} onChange={(e) => set('inside_dhaka_shipping', Number(e.target.value))} />
            </Field>
            <Field label="Outside Dhaka (৳)">
              <TextInput type="number" min={0} value={form.outside_dhaka_shipping ?? 0} onChange={(e) => set('outside_dhaka_shipping', Number(e.target.value))} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Free shipping over (৳)" hint="Leave empty to disable free shipping.">
                <TextInput
                  type="number" min={0}
                  value={form.free_shipping_over ?? ''}
                  onChange={(e) => set('free_shipping_over', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Payment Methods</h2>
          <p className="mb-4 text-xs text-slate-400">Toggle which payment options customers see at checkout. Manual methods show your number for customers to send money to.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <Toggle label="Cash on Delivery" checked={form.payment_cod_enabled !== false} onChange={(v) => set('payment_cod_enabled', v)} />
              <p className="mt-1 text-xs text-slate-400">Only shown for physical products.</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <Toggle label="bKash (Manual)" checked={!!form.payment_bkash_enabled} onChange={(v) => set('payment_bkash_enabled', v)} />
              <Field label="bKash number">
                <TextInput value={form.payment_bkash_number ?? ''} onChange={(e) => set('payment_bkash_number', e.target.value)} placeholder="01XXXXXXXXX" />
              </Field>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <Toggle label="Nagad (Manual)" checked={!!form.payment_nagad_enabled} onChange={(v) => set('payment_nagad_enabled', v)} />
              <Field label="Nagad number">
                <TextInput value={form.payment_nagad_number ?? ''} onChange={(e) => set('payment_nagad_number', e.target.value)} placeholder="01XXXXXXXXX" />
              </Field>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <Toggle label="Rocket (Manual)" checked={!!form.payment_rocket_enabled} onChange={(v) => set('payment_rocket_enabled', v)} />
              <Field label="Rocket number">
                <TextInput value={form.payment_rocket_number ?? ''} onChange={(e) => set('payment_rocket_number', e.target.value)} placeholder="01XXXXXXXXX" />
              </Field>
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 md:col-span-2">
              <Toggle label="Online / Merchant payment (coming soon)" checked={!!form.payment_merchant_enabled} onChange={(v) => set('payment_merchant_enabled', v)} />
              <Field label="Provider name (e.g. SSLCommerz, Stripe)">
                <TextInput value={form.payment_merchant_provider ?? ''} onChange={(e) => set('payment_merchant_provider', e.target.value)} placeholder="SSLCommerz" />
              </Field>
              <p className="mt-1 text-xs text-slate-400">Enable this when your merchant account is ready. Card/online payments will appear at checkout.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Email Notifications</h2>
            <p className="mb-4 text-xs text-slate-400">Order emails are sent from shipontalukdar699@gmail.com via Gmail SMTP. Requires SMTP_USER + SMTP_APP_PASSWORD env vars on Vercel.</p>
            <TestEmailBox />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Homepage Sections</h2>
            <p className="mb-4 text-xs text-slate-400">Toggle sections on/off, reorder with ↑↓, or add/remove. Only enabled sections with 4+ products show on the homepage.</p>
            <HomepageSectionsManager
              sections={form.homepage_sections ?? []}
              onChange={(v) => set('homepage_sections', v)}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end border-t border-slate-200 bg-gray-50 py-4">
        <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</PrimaryButton>
      </div>
    </div>
  );
}

function TestEmailBox() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  async function send() {
    setSending(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email.trim() }),
      });
      const data = await res.json();
      setResult(res.ok ? '✅ Test email sent! Check the inbox.' : `❌ ${data.error || 'Failed'}`);
    } catch {
      setResult('❌ Failed to send.');
    } finally {
      setSending(false);
    }
  }

  async function checkConfig() {
    setResult('Checking…');
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debug: true }),
      });
      const d = await res.json();
      setResult(
        `User: ${d.smtp_user_masked} (${d.smtp_user_length} chars) | Pass: ${d.smtp_pass_set ? `${d.smtp_pass_length} chars` : 'NOT SET'}${d.smtp_pass_has_spaces ? ' ⚠️ HAS SPACES' : ''}`,
      );
    } catch {
      setResult('❌ Check failed.');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <TextInput
        value={email}
        onChange={(e) => { setEmail(e.target.value); setResult(''); }}
        placeholder="Enter email to test"
        type="email"
        className="flex-1"
      />
      <button
        onClick={send}
        disabled={sending || !email.trim()}
        className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy-dark disabled:bg-gray-300"
      >
        {sending ? 'Sending…' : 'Send Test Email'}
      </button>
      <button
        onClick={checkConfig}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
      >
        Check Config
      </button>
      {result && <p className="text-sm sm:ml-2">{result}</p>}
    </div>
  );
}

function HomepageSectionsManager({
  sections,
  onChange,
}: {
  sections: { title: string; category_slug: string; enabled?: boolean }[];
  onChange: (v: { title: string; category_slug: string; enabled?: boolean }[]) => void;
}) {
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.items ?? d.categories ?? [];
        setCategories(list.map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name })));
      })
      .catch(() => {});
  }, []);

  const add = () => {
    const first = categories.find((c) => !sections.some((s) => s.category_slug === c.slug));
    if (!first) return;
    onChange([...sections, { title: first.name, category_slug: first.slug }]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const update = (i: number, patch: Partial<{ title: string; category_slug: string; enabled: boolean }>) => {
    const next = sections.map((s, k) => (k === i ? { ...s, ...patch } : s));
    onChange(next);
  };

  const remove = (i: number) => onChange(sections.filter((_, k) => k !== i));

  return (
    <div className="space-y-2">
      {sections.length === 0 && (
        <p className="text-sm text-slate-400">No sections yet. Add one below — e.g. Laptop, Mobile, Gadget.</p>
      )}
      {sections.map((s, i) => (
        <div key={i} className={`flex flex-col sm:flex-row gap-2 items-stretch sm:items-center rounded-lg border p-2.5 ${s.enabled === false ? 'border-slate-200 bg-slate-100 opacity-60' : 'border-slate-200 bg-slate-50'}`}>
          <button
            type="button"
            role="switch"
            aria-checked={s.enabled !== false}
            aria-label={`Toggle ${s.title}`}
            onClick={() => update(i, { enabled: s.enabled === false ? true : false })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s.enabled === false ? 'bg-slate-300' : 'bg-green-500'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.enabled === false ? 'left-0.5' : 'left-[22px]'}`} />
          </button>
          <span className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === sections.length - 1}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
          </span>
          <select
            value={s.category_slug}
            onChange={(e) => {
              const cat = categories.find((c) => c.slug === e.target.value);
              update(i, { category_slug: e.target.value, title: cat ? cat.name : s.title });
            }}
            className="h-10 px-2 border border-gray-300 rounded-md text-[13px] bg-white outline-none focus:border-brand min-w-0 flex-1"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <input
            value={s.title}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder="Section title"
            className="h-10 px-3 border border-gray-300 rounded-md text-[13px] bg-white outline-none focus:border-brand min-w-0 flex-[2]"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 shrink-0"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={categories.length > 0 && sections.length >= categories.length}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
      >
        + Add Section
      </button>
    </div>
  );
}
