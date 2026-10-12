import Link from 'next/link';
import { Fragment } from 'react';
import { IconChevronRight, IconHome } from './icons';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px]">
      <ol className="flex items-center flex-wrap gap-1 text-ink">
        <li>
          <Link href="/" className="flex items-center hover:text-brand" aria-label="Home">
            <IconHome className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, i) => (
          <Fragment key={i}>
            <li aria-hidden="true">
              <IconChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </li>
            <li>
              {item.href && i < items.length - 1 ? (
                <Link href={item.href} className="hover:text-brand hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-gray-800 font-medium">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
