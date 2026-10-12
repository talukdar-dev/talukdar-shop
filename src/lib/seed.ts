// Demo catalog seed — original demo content for Talukdar Shop.
// When Supabase env vars are set, the live DB replaces this seed.

import type { Banner, Brand, Category, Product, SiteSettings } from './types';
import { placeholder } from './placeholder';

export const siteSettings: SiteSettings = {
  site_name: 'Talukdar Shop',
  tagline: 'Best Tech Shop in Bangladesh',
  hotline: '16793',
  hotline_hours: 'Everyday 9:00 AM – 10:00 PM',
  email: 'support@talukdarshop.com',
  address: 'Level 5, Block C, Bashundhara City, Dhaka 1215',
  announcement: 'Mega Tech Fest — up to 30% off on laptops & accessories!',
  announcement_link: '/offers',
  facebook: 'https://facebook.com/talukdarshop',
  youtube: 'https://youtube.com/@talukdarshop',
  currency: '৳',
  free_shipping_over: 50000,
  inside_dhaka_shipping: 60,
  outside_dhaka_shipping: 120,
};

export const categories: Category[] = [
  { id: 'c-laptop', name: 'Laptop', slug: 'laptop', icon: '💻', sort_order: 1, is_active: true, description: 'All laptops — gaming, ultrabook, business & student laptops.', meta_title: 'Laptop Price in Bangladesh | Talukdar Shop' },
  { id: 'c-desktop', name: 'Desktop', slug: 'desktop', icon: '🖥️', sort_order: 2, is_active: true, description: 'Brand PCs, all-in-one & custom desktop computers.' },
  { id: 'c-monitor', name: 'Monitor', slug: 'monitor', icon: '🖥️', sort_order: 3, is_active: true },
  { id: 'c-component', name: 'Component', slug: 'component', icon: '⚙️', sort_order: 4, is_active: true, description: 'Processor, motherboard, RAM, graphics card, SSD & more.' },
  { id: 'c-accessories', name: 'Accessories', slug: 'accessories', icon: '🎧', sort_order: 5, is_active: true },
  { id: 'c-gadget', name: 'Gadget', slug: 'gadget', icon: '⌚', sort_order: 6, is_active: true },
  { id: 'c-mobile', name: 'Mobile', slug: 'mobile', icon: '📱', sort_order: 7, is_active: true },
  { id: 'c-ups', name: 'UPS', slug: 'ups', icon: '🔋', sort_order: 8, is_active: true },
  { id: 'c-printer', name: 'Printer', slug: 'printer', icon: '🖨️', sort_order: 9, is_active: true },
  { id: 'c-software', name: 'Software', slug: 'software', icon: '💿', sort_order: 10, is_active: true },
];

export const brands: Brand[] = [
  { id: 'b-hp', name: 'HP', slug: 'hp', is_active: true },
  { id: 'b-dell', name: 'Dell', slug: 'dell', is_active: true },
  { id: 'b-lenovo', name: 'Lenovo', slug: 'lenovo', is_active: true },
  { id: 'b-asus', name: 'Asus', slug: 'asus', is_active: true },
  { id: 'b-acer', name: 'Acer', slug: 'acer', is_active: true },
  { id: 'b-apple', name: 'Apple', slug: 'apple', is_active: true },
  { id: 'b-samsung', name: 'Samsung', slug: 'samsung', is_active: true },
  { id: 'b-logitech', name: 'Logitech', slug: 'logitech', is_active: true },
];

const P = (
  id: string, name: string, slug: string, sku: string,
  category_id: string, brand_id: string, price: number,
  extra: Partial<Product> = {},
): Product => ({
  id, name, slug, sku, category_id, brand_id, price,
  old_price: null,
  images: [placeholder(name)],
  stock_qty: 25,
  is_featured: false, is_new: false, is_flash_deal: false,
  flash_price: null, flash_ends_at: null,
  rating: 4.5, reviews_count: 12,
  emi_available: price >= 20000,
  is_active: true,
  short_desc: `${name} — 100% genuine product with official warranty from Talukdar Shop.`,
  description: `<p>${name} is available at the best price in Bangladesh from Talukdar Shop. Buy 100% genuine products with official warranty, fast delivery inside & outside Dhaka, and easy EMI facility.</p><ul><li>100% genuine & brand new</li><li>Official warranty included</li><li>Fast delivery across Bangladesh</li><li>EMI available on selected banks</li></ul>`,
  specs: { Warranty: '1 Year Official Warranty' },
  ...extra,
});

export const products: Product[] = [
  P('p1', 'HP 15s Core i5 13th Gen 8GB RAM 512GB SSD Laptop', 'hp-15s-i5-13th-gen', 'TS-LT-001', 'c-laptop', 'b-hp', 68500, { old_price: 72000, is_featured: true, rating: 4.7, reviews_count: 34, specs: { Processor: 'Intel Core i5-1335U', RAM: '8GB DDR4', Storage: '512GB NVMe SSD', Display: '15.6" FHD', Warranty: '2 Years Official Warranty' } }),
  P('p2', 'Dell Inspiron 3530 Core i7 13th Gen 16GB 512GB', 'dell-inspiron-3530-i7', 'TS-LT-002', 'c-laptop', 'b-dell', 96500, { is_new: true, rating: 4.8, reviews_count: 19 }),
  P('p3', 'Lenovo IdeaPad Slim 3 Ryzen 5 7530U 16GB 512GB', 'lenovo-ideapad-slim3-r5', 'TS-LT-003', 'c-laptop', 'b-lenovo', 74200, { old_price: 78000, is_flash_deal: true, flash_price: 69900, flash_ends_at: new Date(Date.now() + 2 * 864e5).toISOString(), rating: 4.6, reviews_count: 41 }),
  P('p4', 'Asus TUF Gaming F15 i5 11th Gen RTX 2050 8GB', 'asus-tuf-f15-rtx2050', 'TS-LT-004', 'c-laptop', 'b-asus', 98500, { is_featured: true, rating: 4.9, reviews_count: 58 }),
  P('p5', 'Acer Aspire Lite 15 Core i3 N300 8GB 512GB', 'acer-aspire-lite-i3', 'TS-LT-005', 'c-laptop', 'b-acer', 46500, { is_new: true }),
  P('p6', 'Apple MacBook Air M2 8GB 256GB Midnight', 'macbook-air-m2', 'TS-LT-006', 'c-laptop', 'b-apple', 124500, { is_featured: true, rating: 4.9, reviews_count: 27 }),
  P('p7', 'HP ProDesk 400 G9 i5 12th Gen Brand PC', 'hp-prodesk-400-g9', 'TS-DT-001', 'c-desktop', 'b-hp', 62000, { rating: 4.5, reviews_count: 9 }),
  P('p8', 'Custom Ryzen 5 5600G Gaming PC 16GB 512GB', 'ryzen-5600g-gaming-pc', 'TS-DT-002', 'c-desktop', 'b-asus', 58000, { is_flash_deal: true, flash_price: 54900, flash_ends_at: new Date(Date.now() + 3 * 864e5).toISOString(), is_featured: true, rating: 4.8, reviews_count: 63 }),
  P('p9', 'Samsung 24" FHD 100Hz Borderless Monitor', 'samsung-24-fhd-100hz', 'TS-MN-001', 'c-monitor', 'b-samsung', 16500, { old_price: 18500, is_featured: true, rating: 4.6, reviews_count: 88 }),
  P('p10', 'Dell 27" QHD IPS 165Hz Gaming Monitor', 'dell-27-qhd-165hz', 'TS-MN-002', 'c-monitor', 'b-dell', 34500, { is_new: true, rating: 4.7, reviews_count: 15 }),
  P('p11', 'AMD Ryzen 5 5600 Processor', 'ryzen-5-5600', 'TS-CP-001', 'c-component', 'b-asus', 14200, { is_featured: true, rating: 4.9, reviews_count: 112 }),
  P('p12', 'NVIDIA RTX 4060 8GB GDDR6 Graphics Card', 'rtx-4060-8gb', 'TS-CP-002', 'c-component', 'b-asus', 38500, { old_price: 41000, is_flash_deal: true, flash_price: 36900, flash_ends_at: new Date(Date.now() + 864e5).toISOString(), rating: 4.8, reviews_count: 47 }),
  P('p13', '16GB DDR4 3200MHz Desktop RAM', '16gb-ddr4-3200', 'TS-CP-003', 'c-component', 'b-samsung', 4800, { rating: 4.7, reviews_count: 203 }),
  P('p14', '1TB NVMe Gen4 SSD 7400MB/s', '1tb-nvme-gen4', 'TS-CP-004', 'c-component', 'b-samsung', 9500, { is_new: true, rating: 4.8, reviews_count: 76 }),
  P('p15', 'Logitech G304 Lightspeed Wireless Mouse', 'logitech-g304', 'TS-AC-001', 'c-accessories', 'b-logitech', 3450, { old_price: 3950, is_featured: true, rating: 4.9, reviews_count: 342 }),
  P('p16', 'Logitech K380 Multi-Device Bluetooth Keyboard', 'logitech-k380', 'TS-AC-002', 'c-accessories', 'b-logitech', 3950, { rating: 4.7, reviews_count: 158 }),
  P('p17', 'HP LaserJet Pro MFP M232dw Printer', 'hp-laserjet-m232dw', 'TS-PR-001', 'c-printer', 'b-hp', 24500, { rating: 4.6, reviews_count: 22 }),
  P('p18', 'Apple iPhone 15 128GB Blue', 'iphone-15-128gb', 'TS-MB-001', 'c-mobile', 'b-apple', 98500, { is_featured: true, is_new: true, rating: 4.9, reviews_count: 31 }),
  P('p19', 'Samsung Galaxy A55 5G 8GB 256GB', 'galaxy-a55-5g', 'TS-MB-002', 'c-mobile', 'b-samsung', 48900, { old_price: 52000, rating: 4.6, reviews_count: 44 }),
  P('p20', 'Smart Watch Fit Pro AMOLED Bluetooth Calling', 'smart-watch-fit-pro', 'TS-GD-001', 'c-gadget', 'b-samsung', 3850, { is_flash_deal: true, flash_price: 3290, flash_ends_at: new Date(Date.now() + 2 * 864e5).toISOString(), rating: 4.4, reviews_count: 129 }),
  P('p21', 'Wireless Earbuds Pro ANC Bluetooth 5.3', 'earbuds-pro-anc', 'TS-GD-002', 'c-gadget', 'b-logitech', 2950, { is_new: true, rating: 4.5, reviews_count: 87 }),
  P('p22', '1200VA Line Interactive UPS', 'ups-1200va', 'TS-UP-001', 'c-ups', 'b-dell', 7800, { rating: 4.5, reviews_count: 54 }),
  P('p23', 'Windows 11 Pro OEM License Key', 'windows-11-pro-oem', 'TS-SW-001', 'c-software', 'b-dell', 2500, { rating: 4.8, reviews_count: 210 }),
  P('p24', 'Dell 22" FHD Office Monitor E2222H', 'dell-e2222h-22', 'TS-MN-003', 'c-monitor', 'b-dell', 13200, { rating: 4.5, reviews_count: 66 }),
  P('p25', 'Lenovo ThinkPad E14 Gen 5 Ryzen 7 7730U', 'thinkpad-e14-g5', 'TS-LT-007', 'c-laptop', 'b-lenovo', 89500, { is_featured: true, rating: 4.8, reviews_count: 18 }),
  P('p26', 'Asus VivoBook 15 OLED Ryzen 7 7730U 16GB', 'vivobook-15-oled', 'TS-LT-008', 'c-laptop', 'b-asus', 82500, { old_price: 87000, rating: 4.7, reviews_count: 25 }),
  P('p27', 'Gaming Keyboard RGB Mechanical Blue Switch', 'mech-keyboard-rgb', 'TS-AC-003', 'c-accessories', 'b-logitech', 4200, { is_new: true, rating: 4.6, reviews_count: 93 }),
  P('p28', '650W 80+ Bronze Power Supply', 'psu-650w-bronze', 'TS-CP-005', 'c-component', 'b-asus', 5800, { rating: 4.7, reviews_count: 71 }),
  P('p29', 'B550M AM4 Micro-ATX Motherboard', 'b550m-am4', 'TS-CP-006', 'c-component', 'b-asus', 12500, { rating: 4.6, reviews_count: 38 }),
  P('p30', 'Portable 1TB External SSD USB-C', 'portable-ssd-1tb', 'TS-AC-004', 'c-accessories', 'b-samsung', 11500, { is_flash_deal: true, flash_price: 10490, flash_ends_at: new Date(Date.now() + 4 * 864e5).toISOString(), rating: 4.8, reviews_count: 52 }),
];

export const banners: Banner[] = [
  { id: 'bn1', title: 'Mega Tech Fest', subtitle: 'Up to 30% off on laptops', image: placeholder('Mega Tech Fest — Up to 30% Off'), link: '/offers', sort_order: 1, is_active: true, position: 'hero' },
  { id: 'bn2', title: 'Gaming Zone', subtitle: 'RTX laptops & desktops', image: placeholder('Gaming Zone — RTX Ready'), link: '/category/laptop', sort_order: 2, is_active: true, position: 'hero' },
  { id: 'bn3', title: 'EMI Available', subtitle: '0% EMI up to 12 months', image: placeholder('0% EMI Available'), link: '/emi', sort_order: 3, is_active: true, position: 'hero' },
  { id: 'bn4', title: 'Flash Deals', subtitle: 'Hurry — limited stock', image: placeholder('Flash Deals'), link: '/offers', sort_order: 1, is_active: true, position: 'side' },
  { id: 'bn5', title: 'Accessories Fest', subtitle: 'Mouse, keyboard & more', image: placeholder('Accessories Fest'), link: '/category/accessories', sort_order: 2, is_active: true, position: 'side' },
];
