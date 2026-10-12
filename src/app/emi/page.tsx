import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Breadcrumb from '@/components/store/Breadcrumb';
import { IconCheck, IconShield } from '@/components/store/icons';

export const metadata: Metadata = {
  title: 'EMI Terms — 0% EMI up to 12 Months',
  description:
    'Buy now, pay later with 0% EMI up to 12 months at Talukdar Shop. Check eligible banks, cards and EMI terms.',
  alternates: { canonical: '/emi' },
};

const BANKS = [
  'Brac Bank',
  'Dutch-Bangla Bank (DBBL)',
  'Eastern Bank (EBL)',
  'City Bank',
  'Standard Chartered',
  'Jamuna Bank',
  'Mutual Trust Bank',
  'NRB Bank',
  'IFIC Bank',
  'LankaBangla Finance',
  'IDLC Finance',
  'IPDC Finance',
];

const CARDS = ['Visa', 'Mastercard', 'AMEX', 'DBBL Nexus'];

const TERMS = [
  '0% EMI is available for up to 12 months on eligible credit cards from partner banks.',
  'EMI is applicable on orders above ৳10,000 (bank-wise minimums may vary).',
  'The EMI facility is available on the Regular Price of products, not the Cash Discount Price.',
  'EMI tenure options: 3, 6, 9 and 12 months, subject to the issuing bank’s policy.',
  'Your bank may charge processing fees as per its own schedule — please confirm with your bank before ordering.',
  'EMI orders are confirmed after successful card authorization through our secure payment gateway.',
];

export default function EmiPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'EMI Terms' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        EMI Terms — 0% EMI for up to 12 Months
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        Split your purchase into easy monthly installments with 0% interest.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-navy mb-3 flex items-center gap-2">
            <IconShield className="w-5 h-5 text-brand" /> Partner Banks
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {BANKS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[13.5px] text-gray-700">
                <IconCheck className="w-4 h-4 text-green-600 shrink-0" /> {b}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-navy mb-3">Accepted Cards</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {CARDS.map((c) => (
              <span
                key={c}
                className="px-4 py-2 text-[13px] font-bold border border-gray-200 rounded-md bg-gray-50"
              >
                {c}
              </span>
            ))}
          </div>
          <h2 className="text-[16px] font-bold text-navy mb-3">Tenure Options</h2>
          <div className="flex flex-wrap gap-2">
            {['3 Months', '6 Months', '9 Months', '12 Months'].map((t) => (
              <span
                key={t}
                className="px-4 py-2 text-[13px] font-bold bg-brand/10 text-brand rounded-md"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4">
        <h2 className="text-[16px] font-bold text-navy mb-3">EMI Terms &amp; Conditions</h2>
        <ul className="space-y-2">
          {TERMS.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] text-gray-700 leading-relaxed">
              <span className="text-brand font-black shrink-0">{i + 1}.</span> {t}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
