import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: 'Admin — Talukdar Shop' };

// Admin pages use client-side hooks (usePathname) and session auth —
// opt out of instant-navigation prerender validation for this segment.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
