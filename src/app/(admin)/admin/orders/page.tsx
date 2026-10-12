'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { taka } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import {
  Badge, DataTable, DbNotice, PageHeader, Select, Spinner,
} from '@/components/admin/UI';

const ALL = 'all';
const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const router = useRouter();
  const [items, setItems] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.demo) setDemo(true);
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === ALL ? items : items.filter((o) => o.status === filter);

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Orders"
        sub={`${filtered.length} of ${items.length} orders`}
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
            <option value={ALL}>All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        }
      />
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Order>
          rows={filtered}
          emptyText="No orders yet."
          columns={[
            {
              key: 'order',
              header: 'Order',
              render: (o) => (
                <span>
                  <span className="font-semibold text-slate-900">{o.order_no}</span>
                  <span className="block text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleString()}
                  </span>
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (o) => (
                <span>
                  {o.customer_name}
                  <span className="block text-xs text-slate-400">{o.phone}</span>
                </span>
              ),
            },
            { key: 'items', header: 'Items', render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
            { key: 'total', header: 'Total', render: (o) => <span className="font-semibold">{taka(o.total)}</span> },
            { key: 'payment', header: 'Payment', render: (o) => <span className="uppercase text-slate-600">{o.payment_method}</span> },
            { key: 'status', header: 'Status', render: (o) => <Badge text={o.status} /> },
            {
              key: 'actions',
              header: '',
              className: 'whitespace-nowrap',
              render: (o) => (
                <button
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  View
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
