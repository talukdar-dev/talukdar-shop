import nodemailer, { type Transporter } from 'nodemailer';
import type { Order } from './types';
import { taka } from './format';

const LOGO_URL = 'https://res.cloudinary.com/w1qo6mno/image/upload/talukdar-shop/talukdar-shop-logo-v5.png';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD);
}

const baseStyle = `
  body { margin: 0; padding: 0; background: #f4f5f7; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: #0a1633; padding: 24px 32px; text-align: center; }
  .header img { max-height: 48px; }
  .body { padding: 32px; color: #333; }
  .body h1 { font-size: 22px; color: #0a1633; margin: 0 0 12px; }
  .body p { font-size: 14px; line-height: 1.6; color: #555; }
  .order-box { background: #f8f9fb; border: 1px solid #e8e8e8; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .order-box table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .order-box td { padding: 6px 0; }
  .order-box .label { color: #888; width: 40%; }
  .order-box .value { color: #222; font-weight: 600; }
  .items { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13.5px; }
  .items th { background: #0a1633; color: #fff; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; }
  .items td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  .items tr:last-child td { border-bottom: none; }
  .totals { text-align: right; font-size: 14px; margin-top: 8px; }
  .totals .grand { font-size: 18px; font-weight: 800; color: #ef4a23; }
  .btn { display: inline-block; background: #ef4a23; color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 700; font-size: 14px; margin: 16px 0; }
  .status-paid { display: inline-block; background: #e6f7ee; color: #0a7a3d; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .status-unpaid { display: inline-block; background: #fff3e0; color: #c2610a; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .footer { background: #0a1633; color: #9aa3b8; text-align: center; padding: 20px; font-size: 12px; }
  .footer a { color: #ef4a23; text-decoration: none; }
`;

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td style="text-align:center">${i.qty}</td>
        <td style="text-align:right">${taka(i.price)}</td>
        <td style="text-align:right"><strong>${taka(i.price * i.qty)}</strong></td>
      </tr>`,
    )
    .join('');
  return `
    <table class="items">
      <tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
      ${rows}
    </table>
    <div class="totals">
      <p>Subtotal: ${taka(order.subtotal)}</p>
      ${order.shipping > 0 ? `<p>Shipping: ${taka(order.shipping)}</p>` : `<p>Shipping: Free</p>`}
      ${order.discount > 0 ? `<p>Discount: −${taka(order.discount)}</p>` : ''}
      <p class="grand">Total: ${taka(order.total)}</p>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function paymentBadge(order: Order): string {
  return order.payment_status === 'paid'
    ? `<span class="status-paid">PAID</span>`
    : `<span class="status-unpaid">UNPAID — Payable ${taka(order.total)}</span>`;
}

function layout(title: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyle}</style></head>
  <body><div class="wrapper">
    <div class="header"><img src="${LOGO_URL}" alt="Talukdar Shop"></div>
    <div class="body"><h1>${title}</h1>${content}</div>
    <div class="footer">
      <p>Talukdar Shop — Best Tech Shop in Bangladesh</p>
      <p>Hotline: 16793 (Everyday 9:00 AM – 10:00 PM)</p>
      <p><a href="${SITE_URL}">${SITE_URL.replace('https://', '')}</a></p>
    </div>
  </div></body></html>`;
}

export function orderReceivedEmail(order: Order): { subject: string; html: string } {
  const subject = `Order Received — ${order.order_no} | Talukdar Shop`;
  const html = layout(
    `Thank you, ${escapeHtml(order.customer_name)}!`,
    `
    <p>We have received your order <strong>${order.order_no}</strong> and it is now being processed. Our team will contact you shortly to confirm.</p>
    <div class="order-box"><table>
      <tr><td class="label">Order No</td><td class="value">${order.order_no}</td></tr>
      <tr><td class="label">Payment Method</td><td class="value">${order.payment_method.toUpperCase()}</td></tr>
      <tr><td class="label">Payment Status</td><td class="value">${paymentBadge(order)}</td></tr>
      <tr><td class="label">Delivery Address</td><td class="value">${escapeHtml(order.address)}${order.area ? `, ${escapeHtml(order.area)}` : ''}, ${escapeHtml(order.city)}</td></tr>
    </table></div>
    ${itemsTable(order)}
    <p style="text-align:center"><a class="btn" href="${SITE_URL}">Continue Shopping</a></p>
    <p>If you have any questions, reply to this email or call our hotline <strong>16793</strong>.</p>`,
  );
  return { subject, html };
}

export function orderConfirmedEmail(order: Order): { subject: string; html: string } {
  const subject = `Order Confirmed — ${order.order_no} | Talukdar Shop`;
  const html = layout(
    `Your order is confirmed!`,
    `
    <p>Dear ${escapeHtml(order.customer_name)},</p>
    <p>Great news! Your order <strong>${order.order_no}</strong> has been confirmed and is being prepared for delivery.</p>
    <div class="order-box"><table>
      <tr><td class="label">Order No</td><td class="value">${order.order_no}</td></tr>
      <tr><td class="label">Payment Method</td><td class="value">${order.payment_method.toUpperCase()}</td></tr>
      <tr><td class="label">Payment Status</td><td class="value">${paymentBadge(order)}</td></tr>
      ${order.sender_number ? `<tr><td class="label">Sender Number</td><td class="value">${escapeHtml(order.sender_number)}</td></tr>` : ''}
      ${order.trx_id ? `<tr><td class="label">Transaction ID</td><td class="value">${escapeHtml(order.trx_id)}</td></tr>` : ''}
    </table></div>
    ${itemsTable(order)}
    <p>Your invoice is attached to this email as a PDF.</p>
    <p>Thank you for shopping with Talukdar Shop!</p>`,
  );
  return { subject, html };
}

export function orderCancelledEmail(order: Order): { subject: string; html: string } {
  const subject = `Order Cancelled — ${order.order_no} | Talukdar Shop`;
  const html = layout(
    `Order cancelled`,
    `
    <p>Dear ${escapeHtml(order.customer_name)},</p>
    <p>Your order <strong>${order.order_no}</strong> has been cancelled as requested / by our team.</p>
    <div class="order-box"><table>
      <tr><td class="label">Order No</td><td class="value">${order.order_no}</td></tr>
      <tr><td class="label">Order Total</td><td class="value">${taka(order.total)}</td></tr>
    </table></div>
    <p>If you already made a payment for this order, our team will contact you regarding the refund.</p>
    <p style="text-align:center"><a class="btn" href="${SITE_URL}">Shop Again</a></p>
    <p>If you did not request this cancellation, please contact us immediately at <strong>16793</strong>.</p>`,
  );
  return { subject, html };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}): Promise<boolean> {
  const tp = getTransporter();
  if (!tp) {
    console.warn('[email] SMTP not configured — skipping email to', opts.to);
    return false;
  }
  try {
    await tp.sendMail({
      from: `"Talukdar Shop" <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] send failed:', msg);
    // throw with detail so callers can report it
    throw new Error(msg);
  }
}
