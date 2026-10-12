# Talukdar Shop — Build Spec (cloned from startech.com.bd layout analysis, 2026-10-12)

> Structural spec only. No product copy/images reproduced. All labels below are UI labels/structure observed on the reference site.

## 0. Global tech notes (reference)
- OpenCart-based ("catalog/view/theme/…"). Server-rendered HTML (SEO-friendly, fast TTFB).
- Icons: **Material Icons** font (icon names used as text: `search`, `shopping_basket`, `person`, `card_giftcard`, `flash_on`, `important_devices`, `library_add`, `phone`, `place`, `home`).
- Base font: **"Trebuchet MS", sans-serif**.
- Currency: ৳ (BDT), format like `161,500৳`.

## 1. Header structure

### 1a. Top utility bar (thin strip above main header, left→right)
1. Search icon (mobile search toggler)
2. Cart icon (`shopping_basket`) with item count badge (`0` when empty) → `/checkout/cart`
3. `card_giftcard` icon + **"Offers"** (sub-label: *"Latest Offers"*) → `/information/offer`
4. `flash_on` icon + **"10.10 Deal"** (sub-label: *"Special Deals"*) → `/10-10-deal` (promo slug changes per campaign)
5. `important_devices` icon + **"PC Builder"** → `/tool/pc_builder`
6. `library_add` icon + **"Compare (0)"** → compare tray with count
7. `person` icon + **"Account"** dropdown → **"Register"** (`/account/register`), **"Login"** (`/account/login`)

### 1b. Main header row
- **Logo** (left) → home
- **Search bar** (center, wide): text input `placeholder="Search"`, `autocomplete="off"`, live autocomplete dropdown; search button with material `search` icon
- **Hotline block** (right): `phone` icon + **"16793"** (short code) with sub-text *"9 AM - 8 PM"*; secondary full number `+8809678002003` used in footer/contact areas

### 1c. Main nav (`nav#main-nav > ul.navbar-nav`) — 18 top-level items, in order, each opens a flyout mega-menu (`ul.drop-down.drop-menu-1`) with sub-groups (`drop-menu-2`) and a final **"Show All {Category}"** link
1. Appliance → `/appliance`
2. Desktop → `/desktops`
3. Laptop → `/laptop-notebook`
4. Component → `/component`
5. Monitor → `/monitor`
6. Power → `/power`
7. Phone → `/mobile-phone`
8. Tablet → `/tablet-pc`
9. Office Equipment → `/office-equipment`
10. Camera → `/camera`
11. Security → `/Security-Camera`
12. Networking → `/networking`
13. Software → `/software`
14. Server & Storage → `/server-networking`
15. Accessories → `/accessories`
16. Gadget → `/gadget`
17. Gaming → `/gaming`
18. Lifestyle → `/lifestyle`

Mega-menu pattern per category: sub-category links grouped by theme (e.g. Appliance → TV → brand list: Haier, Samsung, Sony, XIAOMI, Hisense, TCL, SMART, LG, SINGER, beko, ROWA, Realview + type list: LED TV, Smart TV, Android TV, 4K TV + accessories: TV Box, TV Stand & Wall Mount). 2nd-level groups repeat the same pattern (AC → 15+ brands + "AC Ton Calculator" tool link).

## 2. Homepage sections (in order)

1. **Hero slider** (`.home-slider`) — full-width rotating promo banners, linked to offer/category pages
2. **Featured Category** — grid of 16 icon tiles: AC, Portable Power Station, Air Fryer, Drone, Gimbal, Table PC, TV, Fridge, Mobile Phone, Mobile Accessories, Health Monitor, WiFi Camera, Trimmer, Smart Watch, Earbuds, Torch Light (each: icon + label → category URL)
3. **"20+ Physical Stores" strip** — headline + *"Visit Our Store & Get Your Desired IT Product!"* + *"Find Our Store"* link + small search
4. **"10.10 Mega Deal"** (flash deals) — headline + *"Enjoy Exciting Discounts on your desired Products!"* + countdown timer **"Offer Ending In:"** (D / H / M / S boxes) + product card carousel
5. **"Best Laptop Shop in Bangladesh"** — product card grid/carousel
6. **"Best Desktop PC Shop In Bangladesh"** — product card grid/carousel
7. **"Best Gaming PC Shop In Bangladesh"** — product card grid/carousel
8. **"Best Office Equipment Shop In Bangladesh"** — product card grid/carousel
9. **"Largest Gadget Shop In Bangladesh"** — product card grid/carousel
10. **"Top Mobile Shop in Bangladesh"** — product card grid/carousel
11. **"Best Home Appliance Shop in Bangladesh"** — product card grid/carousel
12. **SEO text block** — h2 *"Trusted Online Shopping From Bangladesh at The Best E-Commerce Website"*, long-form paragraph
13. **Service promises strip** — h2 *"Best Price, Product, After-sales Customer Service, & Fastest Delivery"*

### Product card (`.p-item > .p-item-inner`) — used on homepage, listing, related
- `.marks > span.mark` — discount badge, format: **`Save: 3,600৳ (-31%)`** (absolute + %)
- `.p-item-img` — product image wrapped in link → product URL
- `.p-item-details` — product name (linked, 2-line clamp). On listing pages also shows 3–5 short spec bullets (e.g. `Processor: …`, `RAM: …`, `Display: …`, `Features: …`)
- `.p-item-price` — `span.price-new` (e.g. `7,901৳`) + `span.price-old` struck through (e.g. `11,500৳`)
- No star rating, no ATC button on the card itself (click → product page)

## 3. Category / listing page (`/laptop-notebook` pattern)

- **Breadcrumb**: `home › Laptop` (material `home` icon)
- **H1**: pattern *"Buy {Category} at best price in Bangladesh"* (e.g. "Buy Laptop and Notebook at best price in Bangladesh")
- **Layout**: left sidebar filters + right product grid (20 per page default)
- **Per-page selector**: 20 / 24 / 48 / 75 / 90
- **Sort dropdown**: `Default`, `Price (Low > High)`, `Price (High > Low)`
- **Pagination** at bottom
- **Filter groups** (checkbox lists; laptop example): Availability (`In Stock`, `Pre Order`, `Up Coming`), Series (`Consumer Laptops`, `Business Laptops`, `Gaming Laptops`, `Premium Ultrabook Laptops`), Brand (`Apple`, `Microsoft`, `HP`, `Dell`, `Lenovo`…), Processor Type, Processor Model, Generation/Series, Display Size, Display Type, RAM Size, RAM Type, … (filter set is per-category)
- **SEO footer text** on category page (long paragraph, keyword-rich)

## 4. Product detail page (blocks in order)

1. **Breadcrumb**: `home › Laptop › All Laptop › MacBook › {Product name}`
2. **Gallery** (left): main image + thumbnail strip below
3. **Buy box** (right):
   - Product title (h1)
   - Rating summary + review count link (observed: "Reviews (7)")
   - Product code (e.g. `Product Code: 48371`), Brand, Status badge: **In Stock** (green) / Out of Stock / Pre Order / Up Coming
   - Price block (`.product-price-options`): big current price + struck old price; **"Cash Discount Price"** row (*"Online / Cash Payment"*); EMI line (*"14,804৳/month"*); **"Regular Price: 177,650৳"** row; note **"0% EMI for up to 12 Months***"**
   - Quantity stepper (`-` qty `+`)
   - **"Buy Now"** primary button (red); wishlist + compare icon buttons
   - Share icons
4. **Key Features** bullet list
5. **Specification tab** (`.specification-tab`) — grouped spec table (45 rows on sample): group headings + `Feature | Value` rows; first rows: Price, Regular Price, Status, Product Code, then hardware groups
6. **"Latest Price" strip** (`.latest-price`) — price summary band
7. **Q&A section** (`.q-n-r-section`): h3 **"Questions (5)"**, `.question-wrap` items, ask-question form (`.ask-question`)
8. **Reviews section**: h3 **"Reviews (7)"**, `.review-wrap` items with `.review-author`, review form
9. **Related products** (`.related-product-list`) — `.p-item` card carousel

## 5. Cart + checkout

- `/checkout/cart` — cart page (guest fetch rendered an "Oops!" empty/error state; structure: line items with qty steppers, remove, subtotal, continue-shopping + checkout CTA)
- `/checkout/checkout` — single-page checkout (guest → "Oops!"/login gate; logged-in flow: address form → shipping method → payment method → confirm)
- **Payment methods** (from EMI Terms page + site): **Cash on Delivery (COD)**, **bKash**, **Nagad**, **Rocket**, cards (**Visa, Mastercard, AMEX, DBBL Nexus**) via SSLCommerz gateway, **EMI** (0% up to 12 months) via partner banks: Brac Bank, DBBL, EBL, City Bank, Standard Chartered, Jamuna, Mutual Trust, NRB, IFIC, LankaBangla, IDLC, IPDC
- **EMI Terms page** (`/emi-terms`) lists bank-wise EMI plans/tenures
- Dual pricing site-wide: *Cash Discount Price* (online/cash) vs *Regular Price* (EMI/card)

## 6. Footer

- **Column 1 — Support**: hotline `phone 16793` (*9 AM - 8 PM*), `place` **"Store Locator / Find Our Stores"**, Affiliate Program, **EMI Terms**
- **Column 2 — About Us**: About Us, Online Delivery, Privacy Policy, Terms and Conditions, Refund and Return Policy, Star Point Policy, Career, Blog, Contact Us, Brands
- **Column 3 — Stay Connected**: Facebook, YouTube, Instagram, WhatsApp channel icons; **Google Play** + **App Store** download badges; `webteam@startechbd.com`
- **Bottom bar**: `© 2026 Star Tech Ltd | All rights reserved` + `Powered By: Star Tech`
- (Payment method icons row exists on checkout/EMI pages rather than footer.)

## 7. Account pages

- **Login** (`/account/login`): h1 "Account Login"; single form — `username` field with `placeholder="Phone"` (phone-number login, not email) + `password` + submit `btn btn-primary`; social login options (Google/Facebook); link to Register
- **Register** (`/account/register`): phone-based registration
- **Account dashboard** (post-login): Orders (list/detail, reorder), Wishlist, Compare list, Address book, Account settings, **Star Points** (loyalty: `/star-point-policy`), Affiliate dashboard (`/affiliate-program`)

## 8. Special tools & pages

- **PC Builder** (`/tool/pc_builder`): component picker — rows: CPU *(Required)*, CPU Cooler, Motherboard *(Required)*, RAM *(Required)*, Storage *(Required)*, Graphics Card, Power Supply, Casing, Monitor, Casing Cooler, Keyboard, Mouse, Speaker & Home Theater, Headphone — each row has product thumbnail slot + **"Choose"** button opening a product picker modal; live total price; add-full-build to cart
- **AC Ton Calculator** (`/tool/btu_calculator`) — room-size → recommended AC tonnage
- **Laptop Finder** (`/tool/finder`) — quiz-style filter → recommendations
- **Load Calculator** (`/tool/load_calculator`) — UPS/IPS load sizing
- **Offers page** (`/information/offer`): "Latest Offers" — promo banner cards grid
- **Deal page** (`/10-10-deal`): campaign deals with countdown (slug rotates per campaign: 10.10, 11.11 etc.)
- **Store Locator** (`/information/contact`): 20+ physical store addresses with map

## 9. Visual style

- **Primary brand red: `#ef4a23`** (confirmed in theme CSS; darker variant `#e5330b`, orange accent `#ff782f`, promo highlight `#ef9919`)
- Secondary: link blue `#3749bb`, dark navy `#00237e` (header/footer dark areas), text gray `#666666`, page bg `#f1f3f5` / `#fafafa`, card bg `#ffffff`
- Font: `"Trebuchet MS", sans-serif`; icons: Material Icons ligatures
- Cards: white, 1px light border (`#eee`-ish), 4–6px radius, subtle shadow on hover; discount badge red/orange pill top-left of image; price-new bold dark, price-old gray strikethrough
- Section titles: bold dark h2 with red accent bar/link ("View All →") on the right
- Buttons: solid `#ef4a23` red, white uppercase-ish text, slight radius
- Badges: `Save: X৳ (-Y%)` pill; stock status colored text (In Stock green)
