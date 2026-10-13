// Homepage skeleton — mirrors the real homepage layout so loading looks seamless
function ProductCardSkeleton() {
  return (
    <div className="shrink-0 w-[168px] sm:w-[200px]">
      <div className="bg-white border border-[#e8e8e8] rounded-md overflow-hidden">
        <div className="aspect-square bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ cards = 5 }: { cards?: number }) {
  return (
    <section className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 bg-gray-200 rounded w-48 border-l-4 border-gray-200 pl-2.5" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-1">
        {Array.from({ length: cards }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function ShopLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Hero: big banner + 2 side banners */}
      <section className="grid lg:grid-cols-4 gap-3" aria-hidden>
        <div className="lg:col-span-3 rounded-md bg-gray-200 aspect-[16/7] lg:aspect-[16/6]" />
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="rounded-md bg-gray-200 aspect-[16/8] lg:aspect-auto lg:min-h-[120px]" />
          <div className="rounded-md bg-gray-200 aspect-[16/8] lg:aspect-auto lg:min-h-[120px]" />
        </div>
      </section>

      {/* Category tiles */}
      <section className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4" aria-hidden>
        <div className="h-6 bg-gray-200 rounded w-40 mb-3" />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* Product sections */}
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
