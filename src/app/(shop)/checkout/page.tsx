'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart, lineKey, lineUnitPrice, variantLabel } from '@/lib/cart';
import { taka } from '@/lib/format';
import { BD_DISTRICTS, DISTRICTS } from '@/lib/bd-locations';
import SmartImage from '@/components/store/SmartImage';
import type { SiteSettings } from '@/lib/types';

type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'rocket' | 'merchant';

interface PaymentOption {
  v: PaymentMethod;
  label: string;
  note: string;
}

const inputCls =
  'w-full h-10 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand bg-white';
const selectCls =
  'w-full h-10 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand bg-white';

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear, mounted } = useCart();

  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [shipZone, setShipZone] = useState<'inside' | 'outside'>('inside');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  // digital vs physical detection
  const allDigital = useMemo(
    () => lines.length > 0 && lines.every((l) => l.product.product_type === 'digital'),
    [lines],
  );
  const hasPhysical = useMemo(
    () => lines.some((l) => l.product.product_type !== 'digital'),
    [lines],
  );

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        setSettings(s);
        // default payment: first enabled method
        if (s.payment_bkash_enabled) setPayment('bkash');
        else if (s.payment_nagad_enabled) setPayment('nagad');
        else if (s.payment_cod_enabled === false) setPayment('bkash');
      })
      .catch(() => {});
  }, []);

  const insideFee = typeof settings.inside_dhaka_shipping === 'number' ? settings.inside_dhaka_shipping : 60;
  const outsideFee = typeof settings.outside_dhaka_shipping === 'number' ? settings.outside_dhaka_shipping : 120;
  const freeOver = settings.free_shipping_over;

  // no shipping for digital-only orders
  const shipping = useMemo(() => {
    if (allDigital) return 0;
    if (freeOver && subtotal >= freeOver) return 0;
    return shipZone === 'inside' ? insideFee : outsideFee;
  }, [allDigital, freeOver, subtotal, shipZone, insideFee, outsideFee]);

  const total = useMemo(
    () => Math.max(0, subtotal + shipping - couponDiscount),
    [subtotal, shipping, couponDiscount],
  );

  const upazilas = district ? BD_DISTRICTS[district] ?? [] : [];

  const paymentOptions: PaymentOption[] = useMemo(() => {
    const opts: PaymentOption[] = [];
    // COD only for physical products
    if (hasPhysical && settings.payment_cod_enabled !== false) {
      opts.push({ v: 'cod', label: 'Cash on Delivery', note: 'Pay in cash when you receive your order.' });
    }
    if (settings.payment_bkash_enabled) {
      opts.push({
        v: 'bkash',
        label: 'bKash (Manual)',
        note: `Send money to bKash ${settings.payment_bkash_number ?? ''}. You will receive instructions after placing the order.`,
      });
    }
    if (settings.payment_nagad_enabled) {
      opts.push({
        v: 'nagad',
        label: 'Nagad (Manual)',
        note: `Send money to Nagad ${settings.payment_nagad_number ?? ''}. You will receive instructions after placing the order.`,
      });
    }
    if (settings.payment_rocket_enabled) {
      opts.push({
        v: 'rocket',
        label: 'Rocket (Manual)',
        note: `Send money to Rocket ${settings.payment_rocket_number ?? ''}. You will receive instructions after placing the order.`,
      });
    }
    if (settings.payment_merchant_enabled) {
      opts.push({
        v: 'merchant',
        label: `Online Payment${settings.payment_merchant_provider ? ` (${settings.payment_merchant_provider})` : ''}`,
        note: 'Pay securely online with card / mobile banking.',
      });
    }
    // fallback: if nothing enabled, show bkash manual as default
    if (opts.length === 0) {
      opts.push({ v: 'bkash', label: 'bKash (Manual)', note: 'You will receive bKash payment instructions after placing the order.' });
    }
    return opts;
  }, [settings, hasPhysical]);

  // keep selected payment valid when options change
  useEffect(() => {
    if (paymentOptions.length > 0 && !paymentOptions.some((o) => o.v === payment)) {
      setPayment(paymentOptions[0].v);
    }
  }, [paymentOptions, payment]);

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
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^01[0-9]{9}$/.test(phone.trim())) {
      setError('Please enter a valid 11-digit mobile number (e.g. 01712345678).');
      return;
    }
    if (hasPhysical) {
      if (!address.trim() || !district) {
        setError('Please fill in your address and select district.');
        return;
      }
    }
    const isManual = payment === 'bkash' || payment === 'nagad' || payment === 'rocket';
    if (isManual) {
      if (!/^01[0-9]{9}$/.test(senderNumber.trim())) {
        setError('Please enter the sender mobile number you paid from (11 digits).');
        return;
      }
      if (!trxId.trim()) {
        setError('Please enter the transaction ID (TrxID) of your payment.');
        return;
      }
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
          address: hasPhysical ? address.trim() : 'Digital delivery — no shipping address',
          city: district || undefined,
          area: upazila || undefined,
          items: lines.map((l) => ({
            product_id: l.product.id,
            name: l.product.name + (variantLabel(l) ? ` (${variantLabel(l)})` : ''),
            price: lineUnitPrice(l),
            qty: l.qty,
            image: l.product.images[0],
          })),
          subtotal,
          shipping,
          discount: couponDiscount,
          total,
          payment_method: payment,
          ...(isManual ? { sender_number: senderNumber.trim(), trx_id: trxId.trim().toUpperCase() } : {}),
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
      {allDigital && (
        <p className="mt-2 text-[13px] bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-2">
          Digital products — no shipping needed. You will receive download / license details after payment.
        </p>
      )}
      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4 items-start min-w-0">
        <div className="space-y-4 min-w-0">
          {/* contact */}
          <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] mb-3">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
              <input className={inputCls} placeholder="Mobile number * (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" aria-label="Mobile number" />
              <input className={inputCls + ' sm:col-span-2'} placeholder="Email (optional — for digital delivery)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" aria-label="Email" />
            </div>
          </section>

          {/* shipping address — only for physical */}
          {hasPhysical && (
            <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
              <h2 className="font-bold text-[15px] mb-3">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  className={selectCls}
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setUpazila(''); }}
                  aria-label="District"
                >
                  <option value="">Select District *</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  className={selectCls}
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  disabled={!district}
                  aria-label="Upazila"
                >
                  <option value="">{district ? 'Select Upazila / Thana' : 'Select district first'}</option>
                  {upazilas.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <input
                  className={inputCls + ' sm:col-span-2'}
                  placeholder="Full address * (house, road, area)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  aria-label="Address"
                />
              </div>
            </section>
          )}

          {/* shipping method — only for physical */}
          {hasPhysical && (
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
                    <span className="font-bold">{o.fee === 0 ? 'Free' : taka(o.fee)}</span>
                  </label>
                ))}
              </div>
              {freeOver ? (
                <p className="mt-2 text-[12.5px] text-ink">Free shipping on orders over {taka(freeOver)}.</p>
              ) : null}
            </section>
          )}

          {/* payment method */}
          <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] mb-3">Payment Method</h2>
            <div className="space-y-2">
              {paymentOptions.map((p) => (
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

            {/* manual payment details — sender number + transaction id */}
            {(payment === 'bkash' || payment === 'nagad' || payment === 'rocket') && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3.5">
                {payment === 'bkash' && (
                  <div className="mb-3 rounded-md overflow-hidden border border-pink-200">
                    <img
                      src="/images/bkash-payment-guide.webp"
                      alt="How to pay with bKash - step by step guide"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="text-[13px] font-bold text-amber-800 mb-1">
                  {payment === 'bkash' ? 'bKash' : payment === 'nagad' ? 'Nagad' : 'Rocket'} payment details
                </p>
                <p className="text-[12px] text-amber-700 mb-3">
                  Send the total amount first, then enter the details below so we can verify your payment.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">
                      Sender mobile number <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      inputMode="numeric"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">
                      Transaction ID (TrxID) <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. 9HXK2LMN4P"
                      className="w-full h-11 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand bg-white uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* summary */}
        <aside className="bg-white rounded-md border border-[#e8e8e8] p-4 lg:sticky lg:top-16 min-w-0">
          <h2 className="font-bold text-[15px] mb-3">Order Summary</h2>
          <ul className="space-y-2.5 max-h-64 overflow-y-auto thin-scroll mb-3">
            {lines.map((l) => (
              <li key={lineKey(l)} className="flex gap-2.5 items-center">
                <span className="relative w-12 h-12 shrink-0">
                  <SmartImage src={l.product.images[0]} alt={l.product.name} fill className="object-contain" />
                </span>
                <span className="flex-1 min-w-0 text-[12.5px] leading-snug">
                  <span className="block truncate font-medium">{l.product.name}</span>
                  {variantLabel(l) && <span className="block truncate text-ink">{variantLabel(l)}</span>}
                  <span className="text-ink">Qty: {l.qty}</span>
                  {l.product.product_type === 'digital' && (
                    <span className="ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">DIGITAL</span>
                  )}
                </span>
                <span className="text-[12.5px] font-bold shrink-0">{taka(lineUnitPrice(l) * l.qty)}</span>
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
            {hasPhysical && (
              <div className="flex justify-between">
                <dt className="text-ink">Shipping</dt>
                <dd className="font-semibold">{shipping === 0 ? 'Free' : taka(shipping)}</dd>
              </div>
            )}
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
