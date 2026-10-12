/** Global loading skeleton — instant visual feedback on navigation. */
export default function Loading() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 py-4 animate-pulse" aria-label="Loading">
      <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-md border border-[#e8e8e8] p-3">
            <div className="aspect-square bg-gray-200 rounded mb-3" />
            <div className="h-3 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
