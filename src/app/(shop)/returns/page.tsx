import type { Metadata } from 'next';
import Breadcrumb from '@/components/store/Breadcrumb';
import { IconCheck, IconShield } from '@/components/store/icons';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description:
    'Talukdar Shop return and refund policy: 7-day easy replacement for defective, damaged or wrong items delivered in Bangladesh.',
  alternates: { canonical: '/returns' },
};

const ELIGIBLE = [
  'Item arrived damaged, defective, or dead on arrival.',
  'Wrong item or wrong model was delivered.',
  'Item is significantly not as described on the product page.',
];

const NOT_ELIGIBLE = [
  'Change of mind after a correct, working item was delivered.',
  'Damage caused by misuse, accidents, or unauthorized repair.',
  'Items with missing accessories, packaging, or warranty cards.',
  'Consumable or hygiene-sensitive parts once opened (filters, etc.).',
];

const STEPS = [
  'Contact us within 7 days of delivery on our hotline 01333600272 (9:00 AM – 10:00 PM, every day) or WhatsApp, with your order number and a short video/photo showing the issue.',
  'Our team will verify the issue — usually within 24 hours — and arrange a replacement pickup.',
  'Once we receive and inspect the returned item, a replacement is dispatched. If a replacement is not available, a refund is issued.',
  'Refunds for bKash/Nagad/Rocket/bank payments are sent to the same account within 5–7 working days. Cash on Delivery orders are refunded via bKash or bank transfer.',
];

export default function ReturnsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Return & Refund Policy' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        Return &amp; Refund Policy
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        7-day easy replacement for defective, damaged, or wrong items — no hassle, no fine print.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-navy mb-3 flex items-center gap-2">
            <IconShield className="w-5 h-5 text-brand" /> Eligible for Return
          </h2>
          <ul className="space-y-2">
            {ELIGIBLE.map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-gray-700 leading-relaxed">
                <IconCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-navy mb-3">Not Eligible</h2>
          <ul className="space-y-2">
            {NOT_ELIGIBLE.map((t) => (
              <li key={t} className="flex gap-2.5 text-[13.5px] text-gray-700 leading-relaxed">
                <span className="text-red-500 font-black shrink-0">×</span> {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4">
        <h2 className="text-[16px] font-bold text-navy mb-3">How to Request a Return</h2>
        <ul className="space-y-2.5">
          {STEPS.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] text-gray-700 leading-relaxed">
              <span className="text-brand font-black shrink-0">{i + 1}.</span> {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4">
        <h2 className="text-[16px] font-bold text-navy mb-3">Warranty Note</h2>
        <p className="text-[13.5px] text-gray-700 leading-relaxed">
          Products carrying an official brand warranty are serviced under the brand&apos;s own
          warranty terms after the 7-day replacement window. Keep your invoice and warranty
          card safe — they are required for any warranty claim.
        </p>
      </section>
    </>
  );
}
