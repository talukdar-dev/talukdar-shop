'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart';
import { effectivePrice, taka } from '@/lib/format';
import SmartImage from '@/components/store/SmartImage';

type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'emi';

const PAYMENTS: { v: PaymentMethod; label: string; note: string }[] = [
  { v: 'cod', label: 'Cash on Delivery', note: 'Pay in cash when you receive your order.' },
  { v: 'bkash', label: 'bKash', note: 'You will receive bKash payment instructions after placing the order.' },
  { v: 'nagad', label: 'Nagad', note: 'You will receive Nagad payment instructions after placing the order.' },
  { v: 'rocket', label: 'Rocket', note: 'You will receive Rocket payment instructions after placing the order.' },
  { v: 'card', label: 'Debit / Credit Card', note: 'Pay securely online with Visa, Mastercard, AMEX or DBBL Nexus.' },
  { v: 'emi', label: 'EMI — 0% up to 12 months', note: 'Available on eligible bank cards. See the EMI page for the bank list.' },
];

const inputCls =
  'w-full h-10 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand bg-white';

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear, mounted } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [shipZone, setShipZone] = useState<'inside' | 'outside'>('inside');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [insideFee, setInsideFee] = useState(60);
  const [outsideFee, setOutsideFee] = useState(120);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (typeof s.inside_dhaka_shipping === 'number') setInsideFee(s.inside_dhaka_shipping);
        if (typeof s.outside_dhaka_shipping === 'number') setOutsideFee(s.outside_dhaka_shipping);
      })
      .catch(() => {});
  }, []);

  const shipping = shipZone === 'inside' ? insideFee : outsideFee;
  const total = useMemo(
    () => Math.max(0, subtotal + shipping - couponDiscount),
    [subtotal, shipping, couponDiscount],
  );

  const applyCoupon = async () => {
    setCouponMsg('');
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setCouponDiscount(data.discount);
        setCouponMsg(`Coupon applied — you save ${taka(data.discount)}.`);
      } else {
        setCouponDiscount(0);
        setCouponMsg(data.message ?? 'Invalid coupon.');
      }
    } catch {
      setCouponMsg('Could not validate coupon. Try again.');
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (lines.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!name.trim() || !address.trim() || !city.trim()) {
      setError('Please fill in your name, address and city.');
      return;
    }
    if (!/^01[0-9]{9}$/.test(phone.trim())) {
      setError('Please enter a valid 11-digit mobile number (e.g. 01712345678).');
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          area: area.trim() || undefined,
          items: lines.map((l) => ({
            product_id: l.product.id,
            name: l.product.name,
            price: effectivePrice(l.product),
            qty: l.qty,
            image: l.product.images[0],
          })),
          subtotal,
          shipping,
          discount: couponDiscount,
          total,
          payment_method: payment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Order failed');
      clear();
      router.push(`/checkout/success?order_no=${encodeURIComponent(data.order_no)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order. Try again.');
      setPlacing(false);
    }
  };

  if (!mounted) return <p className="text-sm text-ink py-10 text-center">Loading checkout…</p>;

  if (lines.length === 0) {
    return (
      <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center">
        <h1 className="text-[20px] font-bold mb-2">Your cart is empty</h1>
        <p className="text-[13.5px] text-ink mb-5">Add some products before checking out.</p>
        <Link href="/" className="inline-block px-8 h-11 leading-[44px] bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[20px] font-bold text-[#1a1a1a]">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4 items-start">
        <div className="space-y-4">
          {/* contact / shipping */}
          <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] mb-3">Contact &amp; Shipping Information</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
              <input className={inputCls} placeholder="Mobile number * (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-label="Mobile number" />
              <input className={inputCls} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" aria-label="Email" />
              <input className={inputCls} placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" />
              <input className={inputCls + ' sm:col-span-2'} placeholder="Full address *" value={address} onChange={(e) => setAddress(e.target.value)} aria-label="Address" />
              <input className={inputCls} placeholder="Area (optional)" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area" />
            </div>
          </section>

          {/* shipping method */}
          <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] mb-3">Shipping Method</h2>
            <div className="space-y-2">
              {(
                [
                  { v: 'inside', label: 'Inside Dhaka', fee: insideFee },
                  { v: 'outside', label: 'Outside Dhaka', fee: outsideFee },
                ] as const
              ).map((o) => (
                <label
                  key={o.v}
                  className={`flex items-center justify-between px-3.5 h-11 border rounded-md cursor-pointer text-[13.5px] ${
                    shipZone === o.v ? 'border-brand bg-brand/5' : 'border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="shipZone"
                      checked={shipZone === o.v}
                      onChange={() => setShipZone(o.v)}
                      className="w-4 h-4 accent-[#ef4a23]"
                    />
                    <span className="font-semibold">{o.label}</span>
                  </span>
                  <span className="font-bold">{taka(o.fee)}</span>
                </label>
              ))}
            </div>
          </section>

          {/* payment method */}
          <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] mb-3">Payment Method</h2>
            <div className="space-y-2">
              {PAYMENTS.map((p) => (
                <label
                  key={p.v}
                  className={`block px-3.5 py-2.5 border rounded-md cursor-pointer ${
                    payment === p.v ? 'border-brand bg-brand/5' : 'border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-[13.5px]">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === p.v}
                      onChange={() => setPayment(p.v)}
                      className="w-4 h-4 accent-[#ef4a23]"
                    />
                    <span className="font-semibold">{p.label}</span>
                  </span>
                  {payment === p.v && <span className="block text-[12.5px] text-ink mt-1 ml-6">{p.note}</span>}
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* summary */}
        <aside className="bg-white rounded-md border border-[#e8e8e8] p-4 lg:sticky lg:top-16">
          <h2 className="font-bold text-[15px] mb-3">Order Summary</h2>
          <ul className="space-y-2.5 max-h-64 overflow-y-auto thin-scroll mb-3">
            {lines.map((l) => (
              <li key={l.product.id} className="flex gap-2.5 items-center">
                <span className="relative w-12 h-12 shrink-0">
                  <SmartImage src={l.product.images[0]} alt={l.product.name} fill className="object-contain" />
                </span>
                <span className="flex-1 min-w-0 text-[12.5px] leading-snug">
                  <span className="block truncate font-medium">{l.product.name}</span>
                  <span className="text-ink">Qty: {l.qty}</span>
                </span>
                <span className="text-[12.5px] font-bold shrink-0">{taka(effectivePrice(l.product) * l.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2 mb-3">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-[13px] outline-none focus:border-brand uppercase"
              aria-label="Coupon code"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="h-10 px-4 bg-navy hover:bg-navy-dark text-white text-[13px] font-bold rounded-md"
            >
              Apply
            </button>
          </div>
          {couponMsg && <p className="text-[12.5px] text-ink mb-3">{couponMsg}</p>}

          <dl className="text-[13.5px] space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between">
              <dt className="text-ink">Subtotal</dt>
              <dd className="font-semibold">{taka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink">Shipping</dt>
              <dd className="font-semibold">{taka(shipping)}</dd>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Coupon discount</dt>
                <dd className="font-semibold">−{taka(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-[16px] font-black pt-1.5 border-t border-gray-100">
              <dt>Total</dt>
              <dd className="text-brand">{taka(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-3 text-[13px] bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={placing}
            className="mt-4 w-full h-11 bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white text-[14px] font-bold rounded-md transition-colors uppercase tracking-wide"
          >
            {placing ? 'Placing Order…' : 'Place Order'}
          </button>
        </aside>
      </form>
    </>
  );
}
