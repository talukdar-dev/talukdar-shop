import type { Metadata } from 'next';
import Breadcrumb from '@/components/store/Breadcrumb';
import { IconShield } from '@/components/store/icons';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Talukdar Shop privacy policy: what personal information we collect, how we use it, and how we protect it.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: 'Information We Collect',
    body: [
      'When you place an order, we collect your name, phone number, delivery address, and district/upazila so we can deliver your order.',
      'If you buy a digital product, we also collect your email address so we can send activation details.',
      'If you create an account, we store your login credentials and order history.',
      'We automatically collect basic technical data (device type, browser, pages visited) to keep the site fast and secure.',
    ],
  },
  {
    h: 'How We Use Your Information',
    body: [
      'To process, deliver, and support your orders — including delivery updates by phone, SMS, email, or WhatsApp.',
      'To handle returns, refunds, and warranty claims.',
      'To improve our website, product range, and customer service.',
      'We do not sell your personal information to anyone.',
    ],
  },
  {
    h: 'Payments',
    body: [
      'We accept Cash on Delivery (COD). We do not collect or store your mobile banking PINs, card numbers, or bank details on our website.',
      'Refunds for COD orders are sent via bKash or bank transfer — we will ask for your account details only when a refund is due.',
    ],
  },
  {
    h: 'Data Sharing',
    body: [
      'We share your name, phone number, and delivery address with our courier partners solely for delivering your order.',
      'We may share information with authorities if required by Bangladeshi law.',
    ],
  },
  {
    h: 'Your Rights',
    body: [
      'You can ask us at any time what personal data we hold about you, ask us to correct it, or ask us to delete your account and personal data.',
      'Contact our hotline 01616266559 (9:00 AM – 10:00 PM, every day) for any privacy request.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        Privacy Policy
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        Your personal information belongs to you. Here is exactly what we collect and why.
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
