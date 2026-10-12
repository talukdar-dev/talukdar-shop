'use client';

import { useEffect, useState } from 'react';
import { slugify } from '@/lib/format';
import type { Category } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, Field, GhostButton, ImageUpload,
  Modal, PageHeader, PrimaryButton, Select, Spinner, TextArea, TextInput, Toggle,
} from '@/components/admin/UI';

const empty: Partial<Category> = {
  name: '', slug: '', icon: '', image: '', parent_id: null,
  sort_order: 0, is_active: true, description: '', meta_title: '', meta_description: '',
};

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [modal, setModal] = useState<null | Partial<Category>>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openEdit(c?: Category) {
    setError('');
    setModal(c ? { ...c } : { ...empty });
  }

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
        isEdit ? `/api/admin/categories/${modal.id}` : '/api/admin/categories',
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
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: keyof Category, v: unknown) =>
    setModal((m) => (m ? { ...m, [k]: v } : m));

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Categories"
        sub={`${items.length} categories`}
        actions={<PrimaryButton onClick={() => openEdit()}>Add Category</PrimaryButton>}
      />
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Category>
          rows={items}
          emptyText="No categories yet."
          columns={[
            { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
            { key: 'slug', header: 'Slug', render: (c) => <code className="text-xs text-slate-500">{c.slug}</code> },
            { key: 'sort', header: 'Sort', render: (c) => c.sort_order },
            { key: 'status', header: 'Status', render: (c) => <Badge text={c.is_active ? 'Active' : 'Inactive'} /> },
            {
              key: 'actions',
              header: 'Actions',
              className: 'whitespace-nowrap',
              render: (c) => (
                <span className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                  <ConfirmButton onConfirm={() => remove(c.id)} />
                </span>
              ),
            },
          ]}
        />
      )}

      {modal && (
        <Modal title={modal.id ? 'Edit Category' : 'Add Category'} onClose={() => setModal(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Icon (text/emoji code)">
              <TextInput value={modal.icon ?? ''} onChange={(e) => set('icon', e.target.value)} placeholder="laptop" />
            </Field>
            <Field label="Sort order">
              <TextInput type="number" value={modal.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </Field>
            <Field label="Parent category">
              <Select
                value={modal.parent_id ?? ''}
                onChange={(e) => set('parent_id', e.target.value || null)}
              >
                <option value="">None (top level)</option>
                {items.filter((c) => c.id !== modal.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end pb-2">
              <Toggle label="Active" checked={!!modal.is_active} onChange={(v) => set('is_active', v)} />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload label="Category image" value={modal.image ?? ''} onChange={(u) => set('image', u)} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <TextArea value={modal.description ?? ''} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
            <Field label="Meta title">
              <TextInput value={modal.meta_title ?? ''} onChange={(e) => set('meta_title', e.target.value)} />
            </Field>
            <Field label="Meta description">
              <TextInput value={modal.meta_description ?? ''} onChange={(e) => set('meta_description', e.target.value)} />
            </Field>
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
