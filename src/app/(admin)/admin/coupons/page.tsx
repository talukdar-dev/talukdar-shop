'use client';

import { useEffect, useState } from 'react';
import { taka } from '@/lib/format';
import type { Coupon } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, Field, GhostButton,
  Modal, PageHeader, PrimaryButton, Select, Spinner, TextInput, Toggle,
} from '@/components/admin/UI';

const empty: Partial<Coupon> = {
  code: '', type: 'percent', value: 10, min_order: 0, is_active: true,
};

export default function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [modal, setModal] = useState<null | Partial<Coupon>>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!modal?.code?.trim()) {
      setError('Code is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const isEdit = !!modal.id;
      const res = await fetch(
        isEdit ? `/api/admin/coupons/${modal.id}` : '/api/admin/coupons',
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
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: keyof Coupon, v: unknown) =>
    setModal((m) => (m ? { ...m, [k]: v } : m));

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Coupons"
        sub={`${items.length} coupons`}
        actions={<PrimaryButton onClick={() => { setError(''); setModal({ ...empty }); }}>Add Coupon</PrimaryButton>}
      />
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Coupon>
          rows={items}
          emptyText="No coupons yet."
          columns={[
            { key: 'code', header: 'Code', render: (c) => <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm font-bold">{c.code}</code> },
            {
              key: 'value',
              header: 'Value',
              render: (c) => (c.type === 'percent' ? `${c.value}%` : taka(c.value)),
            },
            { key: 'min', header: 'Min order', render: (c) => taka(c.min_order) },
            { key: 'status', header: 'Status', render: (c) => <Badge text={c.is_active ? 'Active' : 'Inactive'} /> },
            {
              key: 'actions',
              header: 'Actions',
              className: 'whitespace-nowrap',
              render: (c) => (
                <span className="flex items-center gap-1">
                  <button onClick={() => { setError(''); setModal({ ...c }); }} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">Edit</button>
                  <ConfirmButton onConfirm={() => remove(c.id)} />
                </span>
              ),
            },
          ]}
        />
      )}

      {modal && (
        <Modal title={modal.id ? 'Edit Coupon' : 'Add Coupon'} onClose={() => setModal(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code">
              <TextInput value={modal.code ?? ''} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SAVE10" className="font-mono uppercase" />
            </Field>
            <Field label="Type">
              <Select value={modal.type ?? 'percent'} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (৳)</option>
              </Select>
            </Field>
            <Field label={modal.type === 'percent' ? 'Percent value' : 'Flat value (৳)'}>
              <TextInput type="number" min={0} value={modal.value ?? 0} onChange={(e) => set('value', Number(e.target.value))} />
            </Field>
            <Field label="Minimum order (৳)">
              <TextInput type="number" min={0} value={modal.min_order ?? 0} onChange={(e) => set('min_order', Number(e.target.value))} />
            </Field>
            <div className="sm:col-span-2">
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
