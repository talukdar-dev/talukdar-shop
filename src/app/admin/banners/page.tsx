'use client';

import { useEffect, useState } from 'react';
import type { Banner } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, Field, GhostButton, ImageUpload,
  Modal, PageHeader, PrimaryButton, Select, Spinner, TextInput, Toggle,
} from '@/components/admin/UI';

const empty: Partial<Banner> = {
  title: '', subtitle: '', image: '', link: '/',
  sort_order: 0, is_active: true, position: 'hero',
};

const POSITIONS: Banner['position'][] = ['hero', 'side', 'promo', 'brand'];

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [modal, setModal] = useState<null | Partial<Banner>>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!modal?.title?.trim() || !modal?.image?.trim()) {
      setError('Title and image are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const isEdit = !!modal.id;
      const res = await fetch(
        isEdit ? `/api/admin/banners/${modal.id}` : '/api/admin/banners',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modal),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setDemo(!!data.demo);
        setError(data.error || 'Save failed');
        return;
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: keyof Banner, v: unknown) =>
    setModal((m) => (m ? { ...m, [k]: v } : m));

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Banners"
        sub={`${items.length} banners`}
        actions={<PrimaryButton onClick={() => { setError(''); setModal({ ...empty }); }}>Add Banner</PrimaryButton>}
      />
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Banner>
          rows={items}
          emptyText="No banners yet."
          columns={[
            {
              key: 'banner',
              header: 'Banner',
              render: (b) => (
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  </span>
                  <span>
                    <span className="block font-medium text-slate-900">{b.title}</span>
                    <span className="block max-w-64 truncate text-xs text-slate-400">{b.subtitle}</span>
                  </span>
                </span>
              ),
            },
            { key: 'position', header: 'Position', render: (b) => <Badge text={b.position} /> },
            { key: 'sort', header: 'Sort', render: (b) => b.sort_order },
            { key: 'status', header: 'Status', render: (b) => <Badge text={b.is_active ? 'Active' : 'Inactive'} /> },
            {
              key: 'actions',
              header: 'Actions',
              className: 'whitespace-nowrap',
              render: (b) => (
                <span className="flex items-center gap-1">
                  <button onClick={() => { setError(''); setModal({ ...b }); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                  <ConfirmButton onConfirm={() => remove(b.id)} />
                </span>
              ),
            },
          ]}
        />
      )}

      {modal && (
        <Modal title={modal.id ? 'Edit Banner' : 'Add Banner'} onClose={() => setModal(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <TextInput value={modal.title ?? ''} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Subtitle">
              <TextInput value={modal.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <ImageUpload label="Banner image" value={modal.image ?? ''} onChange={(u) => set('image', u)} />
            </div>
            <Field label="Link URL">
              <TextInput value={modal.link ?? ''} onChange={(e) => set('link', e.target.value)} placeholder="/offers" />
            </Field>
            <Field label="Position">
              <Select value={modal.position ?? 'hero'} onChange={(e) => set('position', e.target.value)}>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Sort order">
              <TextInput type="number" value={modal.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </Field>
            <div className="flex items-end pb-2">
              <Toggle label="Active" checked={!!modal.is_active} onChange={(v) => set('is_active', v)} />
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <GhostButton onClick={() => setModal(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
