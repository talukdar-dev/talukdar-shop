import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center my-8">
      <p className="text-[48px] mb-2">🔍</p>
      <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-2">
        Product Not Found
      </h1>
      <p className="text-[14px] text-ink mb-6">
        Sorry, the product you are looking for does not exist or has been removed.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          href="/"
          className="bg-brand hover:bg-brand-dark text-white font-bold text-[14px] px-6 py-2.5 rounded-md transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/blog"
          className="border border-[#e0e0e0] hover:border-brand text-[14px] font-medium px-6 py-2.5 rounded-md transition-colors"
        >
          Buying Guides
        </Link>
      </div>
    </div>
  );
}
