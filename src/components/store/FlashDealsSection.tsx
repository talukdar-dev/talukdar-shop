import { getProducts } from '@/lib/db';
import ProductCard from './ProductCard';
import { FlashCountdown } from './FlashDeals';
import { IconFlash } from './icons';

/**
 * Server-rendered flash deals section: product cards render on the server
 * (so time-sensitive pricing never leaks into the client prerender),
 * only the countdown ticks on the client.
 */
export default async function FlashDealsSection() {
  const { items } = await getProducts({ flash: true, perPage: 12 });
  if (items.length === 0) return null;
  const endsAt = items
    .map((p) => p.flash_ends_at)
    .filter((x): x is string => !!x && !isNaN(new Date(x).getTime()))
    .sort()
    .pop();

  return (
    <section className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4" aria-label="Flash deals">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] sm:text-[19px] font-bold text-[#222] border-l-4 border-brand pl-2.5">
            <IconFlash className="w-5 h-5 text-brand" /> Flash Deals
          </h2>
          <p className="text-[12.5px] text-ink mt-1 ml-[18px]">
            Enjoy exciting discounts on your desired products!
          </p>
        </div>
        {endsAt && <FlashCountdown endsAt={endsAt} />}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1">
        {items.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[168px] sm:w-[200px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
