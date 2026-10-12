'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { taka } from '@/lib/format';
import type { Order } from '@/lib/types';
import { Badge, DataTable, DbNotice, PageHeader, Spinner } from '@/components/admin/UI';
import type { AdminStats } from '@/lib/admin-db';

interface StatsResponse {
  stats: AdminStats;
  demo?: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, o] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/admin/orders', { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (s.stats) setStats(s.stats);
        if (o.items) setOrders(o.items.slice(0, 8));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // detect demo mode via settings endpoint flag
  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setDemo(d.dbConfigured === false))
      .catch(() => {});
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: 'Total Revenue', value: taka(stats?.revenue ?? 0), sub: 'excl. cancelled orders' },
    { label: 'Orders', value: String(stats?.orders ?? 0), sub: `${stats?.pendingOrders ?? 0} pending` },
    { label: 'Products', value: String(stats?.products ?? 0), sub: 'in catalog' },
    { label: 'Low Stock', value: String(stats?.lowStock.length ?? 0), sub: 'qty ≤ 5' },
  ];

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader title="Dashboard" sub="Store overview at a glance" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          <DataTable<Order>
            emptyText="No orders yet."
            rows={orders}
            columns={[
              { key: 'no', header: 'Order', render: (o) => <span className="font-semibold">{o.order_no}</span> },
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
              { key: 'total', header: 'Total', render: (o) => taka(o.total) },
              { key: 'status', header: 'Status', render: (o) => <Badge text={o.status} /> },
              {
                key: 'date',
                header: 'Date',
                render: (o) => new Date(o.created_at).toLocaleDateString(),
              },
            ]}
          />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Low Stock Alert</h2>
          {(stats?.lowStock.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              All products are well stocked.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {stats!.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="truncate text-sm font-medium text-slate-800 hover:text-blue-700">
                    {p.name}
                  </Link>
                  <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock_qty === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                    {p.stock_qty} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
