import { IconCash, IconHeadset, IconShield, IconTruck } from './icons';

const ITEMS = [
  { icon: IconCash, title: 'Best Price', text: 'Unbeatable deals on 100% genuine products.' },
  { icon: IconShield, title: 'Genuine Product', text: 'Official warranty on every item we sell.' },
  { icon: IconHeadset, title: 'After-Sales Service', text: 'Dedicated support for every customer.' },
  { icon: IconTruck, title: 'Fastest Delivery', text: 'Quick delivery inside & outside Dhaka.' },
];

export default function TrustStrip() {
  return (
    <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-6" aria-label="Why shop with us">
      <h2 className="text-[17px] sm:text-[20px] font-bold text-[#222] text-center mb-5">
        Best Price, Product, After-Sales Customer Service, &amp; Fastest Delivery
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2 px-2">
            <span className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </span>
            <h3 className="text-[14px] font-bold text-gray-800">{title}</h3>
            <p className="text-[12.5px] text-ink leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
