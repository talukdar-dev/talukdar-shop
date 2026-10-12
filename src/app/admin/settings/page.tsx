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
      {result && <p className="text-sm sm:ml-2">{result}</p>}
    </div>
  );
}
