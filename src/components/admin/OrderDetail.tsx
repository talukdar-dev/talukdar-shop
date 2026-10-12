'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taka } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import {
  Badge, DbNotice, GhostButton, PageHeader, PrimaryButton, Select, Spinner,
} from '@/components/admin/UI';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.demo) setDemo(true);
        if (data.item) {
          setOrder(data.item);
          setStatus(data.item.status);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function saveStatus() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDemo(!!data.demo);
        setMsg(data.error || 'Failed to update');
      } else {
        setOrder((o) => (o ? { ...o, status } : o));
        setMsg('Status updated.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function markPaid() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Failed to update');
      } else {
        setOrder((o) => (o ? { ...o, payment_status: 'paid' } : o));
        setMsg('Marked as paid.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (!order) return <p className="text-slate-500">Order not found.</p>;

  return (
    <div className="min-w-0">
      {demo && <DbNotice />}
      <PageHeader
        title={`Order ${order.order_no}`}
        sub={`Placed ${new Date(order.created_at).toLocaleString()}`}
        actions={<GhostButton onClick={() => router.push('/admin/orders')}>Back to orders</GhostButton>}
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 xl:col-span-2 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Items ({order.items.reduce((s, i) => s + i.qty, 0)})</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">No img</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{it.name}</span>
                    <span className="text-xs text-slate-400">Qty {it.qty} × {taka(it.price)}</span>
                  </span>
                  <span className="text-sm font-semibold">{taka(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-slate-200 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{taka(order.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{taka(order.shipping)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>−{taka(order.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                <span>Total</span><span>{taka(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-slate-900">Notes</h2>
              <p className="text-sm text-slate-600">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Status</h2>
            <div className="mb-3"><Badge text={order.status} /></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="flex-1 min-w-0">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <PrimaryButton onClick={saveStatus} disabled={saving || status === order.status}>
                {saving ? '…' : 'Update'}
              </PrimaryButton>
            </div>
            {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Payment</span><span className="font-medium uppercase">{order.payment_method}</span></div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Payment status</span>
                <span className="flex items-center gap-2">
                  <Badge text={order.payment_status} />
                  {order.payment_status === 'unpaid' && (
                    <button
                      onClick={markPaid}
                      disabled={saving}
                      className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1 hover:bg-green-100"
                    >
                      Mark as Paid
                    </button>
                  )}
                </span>
              </div>
              {order.sender_number && (
                <div className="flex justify-between py-0.5"><span className="text-slate-500">Sender number</span><span className="font-medium">{order.sender_number}</span></div>
              )}
              {order.trx_id && (
                <div className="flex justify-between py-0.5"><span className="text-slate-500">Transaction ID</span><span className="font-medium uppercase">{order.trx_id}</span></div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-slate-400">Name</dt><dd className="font-medium">{order.customer_name}</dd></div>
              <div><dt className="text-xs text-slate-400">Phone</dt><dd className="font-medium">{order.phone}</dd></div>
              {order.email && <div><dt className="text-xs text-slate-400">Email</dt><dd>{order.email}</dd></div>}
              <div><dt className="text-xs text-slate-400">Address</dt><dd>{order.address}, {order.area ? `${order.area}, ` : ''}{order.city}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
