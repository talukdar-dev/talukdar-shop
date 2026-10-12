import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from './icons';

interface Props {
  page: number;
  perPage: number;
  total: number;
  pathname: string;
  params: Record<string, string>;
}

function href(pathname: string, params: Record<string, string>, page: number) {
  const sp = new URLSearchParams(params);
  if (page <= 1) sp.delete('page');
  else sp.set('page', String(page));
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function Pagination({ page, perPage, total, pathname, params }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  const cls = (active: boolean) =>
    `min-w-[34px] h-[34px] px-2 inline-flex items-center justify-center text-[13px] font-semibold rounded-md border ${
      active
        ? 'bg-brand border-brand text-white'
        : 'bg-white border-gray-300 text-gray-700 hover:border-brand hover:text-brand'
    }`;

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-6" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(pathname, params, page - 1)} className={cls(false)} aria-label="Previous page">
          <IconChevronLeft className="w-4 h-4" />
        </Link>
      )}
      {pages[0] > 1 && (
        <>
          <Link href={href(pathname, params, 1)} className={cls(false)}>1</Link>
          {pages[0] > 2 && <span className="text-gray-400 px-1">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link key={p} href={href(pathname, params, p)} className={cls(p === page)} aria-current={p === page ? 'page' : undefined}>
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
          <Link href={href(pathname, params, totalPages)} className={cls(false)}>{totalPages}</Link>
        </>
      )}
      {page < totalPages && (
        <Link href={href(pathname, params, page + 1)} className={cls(false)} aria-label="Next page">
          <IconChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  );
}
