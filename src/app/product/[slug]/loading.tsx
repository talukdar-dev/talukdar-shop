/** Product page loading skeleton. */
export default function Loading() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 py-4 animate-pulse" aria-label="Loading product">
      <div className="h-4 w-64 bg-gray-200 rounded mb-4" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-square bg-gray-200 rounded-md" />
        <div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-full mb-2" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
