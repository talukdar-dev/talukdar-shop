import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';
import {
  IconFacebook,
  IconInstagram,
  IconMail,
  IconPhone,
  IconPin,
  IconWhatsapp,
  IconYoutube,
} from './icons';

const PAYMENTS = ['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard', 'AMEX', 'DBBL Nexus'];

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-navy text-white mt-8">
      {/* payment badges */}
      <div className="border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-3 py-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[12px] text-white/60 mr-2">We accept:</span>
          {PAYMENTS.map((p) => (
            <span
              key={p}
              className="text-[11px] font-bold bg-white/10 border border-white/20 rounded px-2.5 py-1"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-3 py-10 grid gap-8 md:grid-cols-3">
        {/* Support */}
        <div>
          <h3 className="text-[15px] font-bold uppercase tracking-wide mb-4 text-brand-orange">
            Support
          </h3>
          <ul className="space-y-2.5 text-[13.5px]">
            <li>
              <a href={`tel:${settings.hotline}`} className="flex items-center gap-2.5 hover:text-brand-orange">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <IconPhone className="w-4 h-4" />
                </span>
                <span>
                  <span className="block text-[17px] font-black">{settings.hotline}</span>
                  <span className="block text-[11px] text-white/60">{settings.hotline_hours}</span>
                </span>
              </a>
            </li>
            <li>
              <a href="/#stores" className="flex items-center gap-2.5 hover:text-brand-orange">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <IconPin className="w-4 h-4" />
                </span>
                Store Locator — Find Our Stores
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-brand-orange">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <IconMail className="w-4 h-4" />
                </span>
                {settings.email}
              </a>
            </li>
            <li>
              <Link href="/emi" className="hover:text-brand-orange hover:underline">
                EMI Terms
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-brand-orange hover:underline">
                Latest Offers
              </Link>
            </li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="text-[15px] font-bold uppercase tracking-wide mb-4 text-brand-orange">
            About Us
          </h3>
          <ul className="space-y-2.5 text-[13.5px]">
            <li>
              <a href="/#about" className="hover:text-brand-orange hover:underline">
                About Talukdar Shop
              </a>
            </li>
            <li>
              <a href="/#brands" className="hover:text-brand-orange hover:underline">
                Our Brands
              </a>
            </li>
            <li>
              <Link href="/pc-builder" className="hover:text-brand-orange hover:underline">
                PC Builder
              </Link>
            </li>
            <li>
              <Link href="/emi" className="hover:text-brand-orange hover:underline">
                EMI Facility
              </Link>
            </li>
            <li>
              <Link href="/account/login" className="hover:text-brand-orange hover:underline">
                My Account
              </Link>
            </li>
            <li className="text-white/60 text-[12.5px] pt-1">{settings.address}</li>
          </ul>
        </div>

        {/* Stay connected */}
        <div>
          <h3 className="text-[15px] font-bold uppercase tracking-wide mb-4 text-brand-orange">
            Stay Connected
          </h3>
          <div className="flex items-center gap-2.5 mb-5">
            {[
              { href: settings.facebook, label: 'Facebook', Icon: IconFacebook },
              { href: settings.youtube, label: 'YouTube', Icon: IconYoutube },
              { href: '#', label: 'Instagram', Icon: IconInstagram },
              { href: '#', label: 'WhatsApp', Icon: IconWhatsapp },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand flex items-center justify-center transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center gap-2 border border-white/25 rounded-md px-3 py-2 text-[12px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4 3.5v17l9.5-8.5L4 3.5z" opacity=".9" />
                <path d="M4 3.5l9.5 8.5 3-2.7L4 3.5zM4 20.5l12.5-6.3-3-2.7L4 20.5z" opacity=".55" />
              </svg>
              <span className="leading-tight text-left">
                <span className="block text-[9px] uppercase text-white/60">Get it on</span>
                <span className="block font-bold">Google Play</span>
              </span>
            </span>
            <span className="flex items-center gap-2 border border-white/25 rounded-md px-3 py-2 text-[12px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.7 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.1 1-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.7-1-2.7-3.7zM14.2 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 1.1.1 2.1-.6 2.8-1.4z" />
              </svg>
              <span className="leading-tight text-left">
                <span className="block text-[9px] uppercase text-white/60">Download on the</span>
                <span className="block font-bold">App Store</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-3 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12.5px] text-white/60">
          <p>© 2026 Talukdar Shop | All rights reserved</p>
          <p>
            Best home appliance shop in Bangladesh — air fryers, rice cookers, fans, cookware &amp;
            home essentials at the best price.
          </p>
        </div>
      </div>
    </footer>
  );
}
