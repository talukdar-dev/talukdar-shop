'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { slugify } from '@/lib/format';
import type { Brand, Category, Product } from '@/lib/types';
import {
  Field, GhostButton, MultiImageUpload, PageHeader, PrimaryButton,
  Select, TextArea, TextInput, Toggle,
} from '@/components/admin/UI';

interface SpecRow {
  k: string;
  v: string;
}

interface VariantOptRow {
  id: string;
  label: string;
  price_delta: string;
}

interface VariantRow {
  id: string;
  name: string;
  options: VariantOptRow[];
}

const newOptId = () => `o-${Math.random().toString(36).slice(2, 8)}`;
const newVarId = () => `v-${Math.random().toString(36).slice(2, 8)}`;

const emptyProduct = (): Partial<Product> => ({
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  brand_id: '',
  price: 0,
  old_price: null,
  short_desc: '',
  description: '',
  specs: {},
  images: [],
  stock_qty: 0,
  product_type: 'physical',
  is_featured: false,
  is_new: false,
  is_flash_deal: false,
  flash_price: null,
  flash_ends_at: null,
  emi_available: false,
  meta_title: '',
  meta_description: '',
  is_active: true,
});

export default function ProductForm({
  initial,
  categories,
  brands,
  isNew,
}: {
  initial: Partial<Product>;
  categories: Category[];
  brands: Brand[];
  isNew: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Product>>({ ...emptyProduct(), ...initial });
  const [specs, setSpecs] = useState<SpecRow[]>(() =>
    Object.entries(initial.specs ?? {}).map(([k, v]) => ({
      k,
      v: Array.isArray(v) ? v.join(', ') : String(v ?? ''),
    })),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    (initial.variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      options: v.options.map((o) => ({
        id: o.id,
        label: o.label,
        price_delta: String(o.price_delta ?? 0),
      })),
    })),
  );

  const set = <K extends keyof Product>(key: K, value: Product[K] | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  function onNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  const flashEndsLocal = useMemo(() => {
    if (!form.flash_ends_at) return '';
    const d = new Date(form.flash_ends_at);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [form.flash_ends_at]);

  async function save() {
    setError('');
    if (!form.name?.trim()) return setError('Product name is required.');
    if (!form.slug?.trim()) return setError('Slug is required.');
    if (!form.category_id) return setError('Category is required.');
    if (!form.brand_id) return setError('Brand is required.');
    if (!(form.price! >= 0)) return setError('Price must be 0 or more.');

    const specObj: Record<string, string> = {};
    for (const r of specs) {
      if (r.k.trim()) specObj[r.k.trim()] = r.v;
    }

    const variantPayload = variants
      .filter((v) => v.name.trim() && v.options.some((o) => o.label.trim()))
      .map((v) => ({
        id: v.id,
        name: v.name.trim(),
        options: v.options
          .filter((o) => o.label.trim())
          .map((o) => ({
            id: o.id,
            label: o.label.trim(),
            price_delta: Number(o.price_delta) || 0,
          })),
      }));

    const payload = { ...form, specs: specObj, variants: variantPayload };
    setSaving(true);
    try {
      const res = await fetch(
        isNew ? '/api/admin/products' : `/api/admin/products/${initial.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }
      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const num = (v: string) => (v === '' ? null : Number(v));

  return (
    <div>
      <PageHeader
        title={isNew ? 'Add Product' : 'Edit Product'}
        sub={isNew ? 'Create a new product' : form.name}
        actions={
          <>
            <GhostButton onClick={() => router.push('/admin/products')}>Cancel</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </PrimaryButton>
          </>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* main column */}
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Basic info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Product name">
                  <TextInput value={form.name ?? ''} onChange={(e) => onNameChange(e.target.value)} placeholder="HP Pavilion 15 Laptop" />
                </Field>
              </div>
              <Field label="Slug" hint="Auto-generated from name; used in the product URL.">
                <TextInput
                  value={form.slug ?? ''}
                  onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }}
                />
              </Field>
              <Field label="SKU">
                <TextInput value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} placeholder="HP-PAV-15-001" />
              </Field>
              <Field label="Short description">
                <TextInput value={form.short_desc ?? ''} onChange={(e) => set('short_desc', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description (HTML allowed)">
                  <TextArea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={6} />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Specifications</h2>
            <div className="space-y-2">
              {specs.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-2/5 shrink-0">
                    <TextInput
                      value={row.k}
                      onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, k: e.target.value } : r)))}
                      placeholder="Key (e.g. Processor)"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TextInput
                      value={row.v}
                      onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? { ...r, v: e.target.value } : r)))}
                      placeholder="Value (e.g. Intel Core i7, 16GB RAM)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-lg px-2 text-red-600 hover:bg-red-50"
                    aria-label="Remove spec"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSpecs((s) => [...s, { k: '', v: '' }])}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                + Add specification
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Variants</h2>
            <p className="mb-4 text-xs text-slate-400">e.g. Color, Size, Subscription length — each option can add to the price.</p>
            <div className="space-y-4">
              {variants.map((v, vi) => (
                <div key={v.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <TextInput
                        value={v.name}
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === vi ? { ...x, name: e.target.value } : x)))}
                        placeholder="Variant name (e.g. Color, Size)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariants((vs) => vs.filter((_, j) => j !== vi))}
                      className="shrink-0 rounded-lg px-2 text-red-600 hover:bg-red-50"
                      aria-label="Remove variant"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {v.options.map((o, oi) => (
                      <div key={o.id} className="flex gap-2">
                        <div className="flex-1">
                          <TextInput
                            value={o.label}
                            onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === vi ? { ...x, options: x.options.map((y, k) => (k === oi ? { ...y, label: e.target.value } : y)) } : x)))}
                            placeholder="Option (e.g. Red, Large, 1 Year)"
                          />
                        </div>
                        <div className="w-32 shrink-0">
                          <TextInput
                            type="number"
                            value={o.price_delta}
                            onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === vi ? { ...x, options: x.options.map((y, k) => (k === oi ? { ...y, price_delta: e.target.value } : y)) } : x)))}
                            placeholder="+ ৳"
                            title="Price difference (+/-)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setVariants((vs) => vs.map((x, j) => (j === vi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x)))}
                          className="shrink-0 rounded-lg px-2 text-red-600 hover:bg-red-50"
                          aria-label="Remove option"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVariants((vs) => vs.map((x, j) => (j === vi ? { ...x, options: [...x.options, { id: newOptId(), label: '', price_delta: '0' }] } : x)))}
                      className="text-[13px] font-medium text-blue-600 hover:underline"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariants((vs) => [...vs, { id: newVarId(), name: '', options: [{ id: newOptId(), label: '', price_delta: '0' }] }])}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                + Add variant
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Images</h2>
            <MultiImageUpload values={form.images ?? []} onChange={(urls) => set('images', urls)} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">SEO</h2>
            <div className="grid gap-4">
              <Field label="Meta title">
                <TextInput value={form.meta_title ?? ''} onChange={(e) => set('meta_title', e.target.value)} />
              </Field>
              <Field label="Meta description">
                <TextArea value={form.meta_description ?? ''} onChange={(e) => set('meta_description', e.target.value)} rows={2} />
              </Field>
            </div>
          </div>
        </div>

        {/* side column */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Organization</h2>
            <div className="grid gap-4">
              <Field label="Category">
                <Select value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value)}>
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Brand">
                <Select value={form.brand_id ?? ''} onChange={(e) => set('brand_id', e.target.value)}>
                  <option value="">Select brand…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Pricing & stock</h2>
            <div className="grid gap-4">
              <Field label="Price (৳)">
                <TextInput type="number" min={0} value={form.price ?? 0} onChange={(e) => set('price', Number(e.target.value))} />
              </Field>
              <Field label="Old price (৳)" hint="Leave empty if no discount.">
                <TextInput
                  type="number" min={0}
                  value={form.old_price ?? ''}
                  onChange={(e) => set('old_price', num(e.target.value))}
                />
              </Field>
              <Field label="Stock quantity">
                <TextInput type="number" min={0} value={form.stock_qty ?? 0} onChange={(e) => set('stock_qty', Number(e.target.value))} />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Flash deal</h2>
            <div className="grid gap-4">
              <Toggle label="Flash deal" checked={!!form.is_flash_deal} onChange={(v) => set('is_flash_deal', v)} />
              <Field label="Flash price (৳)">
                <TextInput type="number" min={0} value={form.flash_price ?? ''} onChange={(e) => set('flash_price', num(e.target.value))} />
              </Field>
              <Field label="Flash ends at">
                <TextInput
                  type="datetime-local"
                  value={flashEndsLocal}
                  onChange={(e) => set('flash_ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Visibility</h2>
            <div className="grid gap-3">
              <Toggle label="Active (visible in store)" checked={!!form.is_active} onChange={(v) => set('is_active', v)} />
              <Toggle label="Featured" checked={!!form.is_featured} onChange={(v) => set('is_featured', v)} />
              <Toggle label="New arrival" checked={!!form.is_new} onChange={(v) => set('is_new', v)} />
              <Toggle label="EMI available" checked={!!form.emi_available} onChange={(v) => set('emi_available', v)} />
              <Field label="Product type">
                <select
                  value={form.product_type ?? 'physical'}
                  onChange={(e) => set('product_type', e.target.value as 'physical' | 'digital')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="physical">Physical — needs shipping</option>
                  <option value="digital">Digital — no shipping needed</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-gray-50 py-4">
        <GhostButton onClick={() => router.push('/admin/products')}>Cancel</GhostButton>
        <PrimaryButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</PrimaryButton>
      </div>
    </div>
  );
}
