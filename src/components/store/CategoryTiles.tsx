import Link from 'next/link';
import type { Category } from '@/lib/types';
import type { SVGProps } from 'react';
import {
  IconBattery,
  IconChip,
  IconDesktop,
  IconDisc,
  IconHeadphones,
  IconLaptop,
  IconMobile,
  IconMonitor,
  IconPrinter,
  IconWatch,
} from './icons';

type IconFn = (p: SVGProps<SVGSVGElement> & { className?: string }) => React.ReactNode;

const ICONS: Record<string, IconFn> = {
  laptop: IconLaptop,
  desktop: IconDesktop,
  monitor: IconMonitor,
  component: IconChip,
  accessories: IconHeadphones,
  gadget: IconWatch,
  mobile: IconMobile,
  ups: IconBattery,
  printer: IconPrinter,
  software: IconDisc,
};

export default function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <section className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4" aria-label="Featured categories">
      <h2 className="text-[17px] sm:text-[19px] font-bold text-[#222] border-l-4 border-brand pl-2.5 mb-3">
        Featured Category
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
        {categories.map((c) => {
          const Icon = ICONS[c.slug] ?? IconChip;
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-1.5 rounded-md border border-gray-100 hover:border-brand/60 hover:shadow-sm py-3 px-1 transition-all bg-[#fafbfc] hover:bg-white"
            >
              <span className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[12px] font-semibold text-gray-700 text-center leading-tight">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
