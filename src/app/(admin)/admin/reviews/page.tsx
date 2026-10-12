'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Review } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, Field, Modal,
  PageHeader, PrimaryButton, Select, Spinner, TextInput,
} from '@/components/admin/UI';

type ReviewRow = Review & { product_name?: string };

export default function ReviewsPage() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [filter, setFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [editing, setEditing] = useState<null | ReviewRow>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const products = useMemo(
    () => [...new Set(items.map((r) => r.product_name).filter(Boolean))].sort(),
    [items]
  );

  const filtered = items.filter((r) => {
    if (productFilter && r.product_name !== productFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        r.customer_name.toLowerCase().includes(q) ||
        r.review_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: editing.customer_name,
          review_text: editing.review_text,
          rating: editing.rating,
          review_date: editing.review_date || null,
          is_approved: editing.is_approved,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Save failed');
        return;
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleApprove(row: ReviewRow) {
    await fetch(`/api/admin/reviews/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved: !row.is_approved }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        sub={`${items.length} total reviews`}
      />
      {demo && <DbNotice />}
      <div className="flex flex-wrap gap-3 mb-4">
        <TextInput
          placeholder="Search name or text…"
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
        />
        <Select
          value={productFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProductFilter(e.target.value)}
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: 'product', header: 'Product', render: (r: ReviewRow) => <span className="text-[12.5px]">{r.product_name ?? '—'}</span> },
            { key: 'customer', header: 'Customer', render: (r: ReviewRow) => <span className="font-medium text-[13px]">{r.customer_name}</span> },
            { key: 'rating', header: 'Rating', render: (r: ReviewRow) => <span className="text-[13px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> },
            { key: 'date', header: 'Date', render: (r: ReviewRow) => <span className="text-[12.5px]">{r.review_date ?? <span className="text-gray-400 italic">no date</span>}</span> },
            { key: 'status', header: 'Status', render: (r: ReviewRow) => <Badge text={r.is_approved ? 'Active' : 'Inactive'} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r: ReviewRow) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing({ ...r })}
                    className="text-[12.5px] text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleApprove(r)}
                    className="text-[12.5px] text-amber-600 hover:underline"
                  >
                    {r.is_approved ? 'Hide' : 'Approve'}
                  </button>
                  <ConfirmButton
                    label="Delete"
                    onConfirm={() => remove(r.id)}
                  />
                </div>
              ),
            },
          ]}
          rows={filtered}
        />
      )}

      {editing && (
        <Modal title="Edit Review" onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <Field label="Customer name">
              <TextInput
                value={editing.customer_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditing({ ...editing, customer_name: e.target.value })}
              />
            </Field>
            <Field label="Product">
              <div className="text-[13.5px] text-gray-600">{editing.product_name}</div>
            </Field>
            <Field label="Rating">
              <Select
                value={String(editing.rating)}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setEditing({ ...editing, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                ))}
              </Select>
            </Field>
            <Field label="Review date">
              <TextInput
                type="date"
                value={editing.review_date ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditing({ ...editing, review_date: e.target.value || null })}
              />
              <p className="text-[12px] text-gray-500 mt-1">
                Leave empty if the date is unknown — it will show without a date on the site.
              </p>
            </Field>
            <Field label="Review text">
              <textarea
                value={editing.review_text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditing({ ...editing, review_text: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand resize-y"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="h-10 px-4 text-[13.5px] border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <PrimaryButton onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
