import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';
import {
  IconCash,
  IconFacebook,
  IconInstagram,
  IconMail,
  IconPhone,
  IconPin,
  IconWhatsapp,
  IconYoutube,
} from './icons';

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-navy text-white mt-8">
      {/* payment badges — only methods actually offered at checkout */}
      <div className="border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-3 py-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[12px] text-white/60 mr-2">We accept:</span>
          <span
            title="Cash on Delivery"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded px-3 py-1.5 text-[13px] font-bold"
          >
            <IconCash className="w-6 h-6" />
            Cash on Delivery
          </span>
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
            <li>
              <Link href="/returns" className="hover:text-brand-orange hover:underline">
                Return &amp; Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-brand-orange hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-brand-orange hover:underline">
                Terms &amp; Conditions
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
              <Link href="/blog" className="hover:text-brand-orange hover:underline">
                Blog & Buying Guides
              </Link>
            </li>
            <li>
              <a href="/#brands" className="hover:text-brand-orange hover:underline">
                Our Brands
              </a>
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
