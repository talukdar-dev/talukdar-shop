import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin — Talukdar Shop',
    template: '%s | Admin — Talukdar Shop',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
