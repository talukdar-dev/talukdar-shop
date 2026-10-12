'use client';

import { useEffect, useState } from 'react';
import { slugify } from '@/lib/format';
import type { Brand } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, Field, GhostButton, ImageUpload,
  Modal, PageHeader, PrimaryButton, Spinner, TextInput, Toggle,
} from '@/components/admin/UI';

const empty: Partial<Brand> = { name: '', slug: '', logo: '', is_active: true };

export default function BrandsPage() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [modal, setModal] = useState<null | Partial<Brand>>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!modal?.name?.trim() || !modal?.slug?.trim()) {
      setError('Name and slug are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const isEdit = !!modal.id;
      const res = await fetch(
        isEdit ? `/api/admin/brands/${modal.id}` : '/api/admin/brands',
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
    await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: keyof Brand, v: unknown) =>
    setModal((m) => (m ? { ...m, [k]: v } : m));

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Brands"
        sub={`${items.length} brands`}
        actions={<PrimaryButton onClick={() => { setError(''); setModal({ ...empty }); }}>Add Brand</PrimaryButton>}
      />
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Brand>
          rows={items}
          emptyText="No brands yet."
          columns={[
            {
              key: 'brand',
              header: 'Brand',
              render: (b) => (
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt={b.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{b.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="font-medium">{b.name}</span>
                </span>
              ),
            },
            { key: 'slug', header: 'Slug', render: (b) => <code className="text-xs text-slate-500">{b.slug}</code> },
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
        <Modal title={modal.id ? 'Edit Brand' : 'Add Brand'} onClose={() => setModal(null)}>
          <div className="grid gap-4">
            <Field label="Name">
              <TextInput
                value={modal.name ?? ''}
                onChange={(e) => {
                  const name = e.target.value;
                  setModal((m) => (m ? { ...m, name, slug: m.id ? m.slug : slugify(name) } : m));
                }}
              />
            </Field>
            <Field label="Slug">
              <TextInput value={modal.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />
            </Field>
            <ImageUpload label="Logo" value={modal.logo ?? ''} onChange={(u) => set('logo', u)} />
            <Toggle label="Active" checked={!!modal.is_active} onChange={(v) => set('is_active', v)} />
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
