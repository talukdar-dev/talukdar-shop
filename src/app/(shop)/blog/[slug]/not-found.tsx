import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center my-8">
      <p className="text-[48px] mb-2">📝</p>
      <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-2">
        Article Not Found
      </h1>
      <p className="text-[14px] text-ink mb-6">
        Sorry, the article you are looking for does not exist.
      </p>
      <Link
        href="/blog"
        className="inline-block bg-brand hover:bg-brand-dark text-white font-bold text-[14px] px-6 py-2.5 rounded-md transition-colors"
      >
        All Articles
      </Link>
    </div>
  );
}
