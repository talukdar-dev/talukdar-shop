'use client';

import { useState } from 'react';

interface QAItem {
  q: string;
  a: string;
  author: string;
}

const seedQA: QAItem[] = [
  {
    q: 'Is this product 100% genuine with official warranty?',
    a: 'Yes. Every unit sold by Talukdar Shop is brand new, sealed pack and comes with official warranty.',
    author: 'Talukdar Shop Support',
  },
  {
    q: 'How long does delivery take outside Dhaka?',
    a: 'Orders outside Dhaka are delivered within 2–4 working days via courier. Inside Dhaka delivery is within 24 hours.',
    author: 'Talukdar Shop Support',
  },
  {
    q: 'Can I buy this on EMI?',
    a: 'Yes, 0% EMI up to 12 months is available on eligible bank cards. See our EMI page for the full bank list.',
    author: 'Talukdar Shop Support',
  },
];

export default function QA() {
  const [list, setList] = useState<QAItem[]>(seedQA);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setList((prev) => [
      ...prev,
      { q: question.trim(), a: 'Thanks for your question! Our support team will answer it shortly.', author: 'Talukdar Shop Support' },
    ]);
    setQuestion('');
    setAsked(true);
  };

  return (
    <section aria-label="Questions and answers">
      <h3 className="text-[18px] font-bold text-[#222] mb-4">Questions ({list.length})</h3>
      <div className="space-y-3 mb-6">
        {list.map((item, i) => (
          <div key={i} className="bg-white border border-[#e8e8e8] rounded-md p-4">
            <p className="text-[14px] font-bold text-gray-800">Q: {item.q}</p>
            <p className="text-[13.5px] text-gray-600 mt-1.5 leading-relaxed">A: {item.a}</p>
            <p className="text-[12px] text-ink mt-2">— {item.author}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="bg-white border border-[#e8e8e8] rounded-md p-4">
        <h4 className="font-bold text-[14px] mb-2.5">Ask a question</h4>
        {asked && (
          <p className="mb-2.5 text-[13px] bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-2">
            Your question has been submitted.
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question about this product…"
            className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand"
            aria-label="Your question"
          />
          <button
            type="submit"
            className="h-10 px-5 bg-navy hover:bg-navy-dark text-white text-[13.5px] font-bold rounded-md transition-colors"
          >
            Ask
          </button>
        </div>
      </form>
    </section>
  );
}
