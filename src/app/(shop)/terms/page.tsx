import type { Metadata } from 'next';
import Breadcrumb from '@/components/store/Breadcrumb';
import { IconShield } from '@/components/store/icons';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Talukdar Shop terms and conditions: ordering, pricing, delivery, payments, and returns.',
  alternates: { canonical: '/terms' },
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: 'Orders & Pricing',
    body: [
      'All prices are in Bangladeshi Taka (৳) and include VAT where applicable.',
      'Prices and discount offers can change without notice. The price at the time you place your order is the price you pay.',
      'We reserve the right to cancel an order if a product is out of stock or a price was listed incorrectly — you will be informed promptly.',
    ],
  },
  {
    h: 'Payment',
    body: [
      'We accept Cash on Delivery (COD) on all orders across Bangladesh. You pay in cash when your order arrives.',
      'No advance payment is required for physical products.',
    ],
  },
  {
    h: 'Delivery',
    body: [
      'Delivery times shown at checkout are estimates. Orders inside Dhaka are dispatched quickly; deliveries outside Dhaka depend on the courier and your district.',
      'Shipping charges are shown at checkout based on your district. Orders over ৳5,000 get free delivery.',
      'Please inspect your parcel on delivery. Report damage, defects, or wrong items within 7 days — see our Return & Refund Policy.',
    ],
  },
  {
    h: 'Returns & Warranty',
    body: [
      'Defective, damaged, or wrong items are eligible for replacement within 7 days of delivery, as described in our Return & Refund Policy.',
      'Products with an official brand warranty are serviced under the brand\u2019s own warranty terms after the 7-day window. Keep your invoice and warranty card.',
    ],
  },
  {
    h: 'Fair Use',
    body: [
      'Bulk or resale orders may be limited or cancelled at our discretion.',
      'Fraudulent orders, false delivery claims, or abuse of the return policy may lead to order cancellation and account suspension.',
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Terms & Conditions' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        Terms &amp; Conditions
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        The simple rules of shopping with Talukdar Shop.
      </p>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <section key={s.h} className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="text-[16px] font-bold text-navy mb-3 flex items-center gap-2">
              <IconShield className="w-5 h-5 text-brand" /> {s.h}
            </h2>
            <ul className="space-y-2">
              {s.body.map((t) => (
                <li key={t} className="text-[13.5px] text-gray-700 leading-relaxed">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
