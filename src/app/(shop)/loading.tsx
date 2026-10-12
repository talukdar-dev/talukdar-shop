// Instant loading feedback for shop page navigations
export default function ShopLoading() {
  return (
    <div className="animate-pulse space-y-4 py-4">
      <div className="h-8 bg-gray-200 rounded-md w-1/3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#e8e8e8] rounded-md overflow-hidden">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
