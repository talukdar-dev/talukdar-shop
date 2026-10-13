import PDFDocument from 'pdfkit';
import type { Order } from './types';
import { taka } from './format';

const NAVY = '#0a1633';
const ORANGE = '#ef4a23';
const GRAY = '#6b7280';
const LIGHT_BG = '#f8f9fb';

async function fetchLogo(): Promise<Buffer | null> {
  try {
    const res = await fetch(
      'https://res.cloudinary.com/w1qo6mno/image/upload/talukdar-shop/talukdar-shop-logo-v2.png',
    );
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(order: Order): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(chunks))),
  );

  const pageW = doc.page.width - 96;
  let y = 48;

  // ---- header ----
  const logo = await fetchLogo();
  if (logo) {
    try {
      doc.image(logo, 48, y, { height: 44 });
    } catch {
      /* ignore */
    }
  } else {
    doc.fontSize(22).fillColor(NAVY).font('Helvetica-Bold').text('TALUKDAR SHOP', 48, y + 8);
  }
  doc
    .fontSize(10)
    .fillColor(GRAY)
    .font('Helvetica')
    .text('Best Tech Shop in Bangladesh', 48, y + 34, { width: 260 });
  doc
    .fontSize(26)
    .fillColor(NAVY)
    .font('Helvetica-Bold')
    .text('INVOICE', 48 + pageW - 200, y + 4, { width: 200, align: 'right' });
  doc
    .fontSize(11)
    .fillColor(ORANGE)
    .text(order.order_no, 48 + pageW - 200, y + 34, { width: 200, align: 'right' });
  y += 72;

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(48, y).lineTo(48 + pageW, y).stroke();
  y += 16;

  // ---- bill to + meta ----
  const colW = pageW / 2;
  doc.fontSize(10).fillColor(GRAY).font('Helvetica-Bold').text('BILL TO', 48, y);
  doc.fontSize(12).fillColor('#111').font('Helvetica-Bold').text(order.customer_name, 48, y + 14);
  doc
    .fontSize(10)
    .fillColor(GRAY)
    .font('Helvetica')
    .text(`${order.address}${order.area ? `, ${order.area}` : ''}, ${order.city}`, 48, y + 30, {
      width: colW - 10,
    })
    .text(`Phone: ${order.phone}`, 48, y + 58);
  if (order.email) doc.text(`Email: ${order.email}`, 48, y + 72);

  const rx = 48 + colW;
  const meta: [string, string][] = [
    ['Invoice No:', order.order_no],
    ['Date:', new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
    ['Payment:', order.payment_method.toUpperCase()],
  ];
  let my = y;
  for (const [k, v] of meta) {
    doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(k, rx, my, { width: 110 });
    doc.fontSize(10).fillColor('#111').font('Helvetica-Bold').text(v, rx + 110, my);
    my += 16;
  }
  // payment status badge
  const paid = order.payment_status === 'paid';
  const badgeText = paid ? 'PAID' : `UNPAID — Payable ${taka(order.total)}`;
  doc.fontSize(11).font('Helvetica-Bold');
  const bw = doc.widthOfString(badgeText) + 24;
  doc.roundedRect(rx, my + 4, bw, 24, 12).fill(paid ? '#e6f7ee' : '#fff3e0');
  doc.fillColor(paid ? '#0a7a3d' : '#c2610a').text(badgeText, rx + 12, my + 11);
  y += 110;

  // ---- items table ----
  const cols = [pageW * 0.52, pageW * 0.12, pageW * 0.18, pageW * 0.18];
  const headers = ['Product', 'Qty', 'Unit Price', 'Total'];
  doc.rect(48, y, pageW, 28).fill(NAVY);
  doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
  let cx = 48;
  headers.forEach((h, i) => {
    doc.text(h, cx + 8, y + 9, { width: cols[i] - 16, align: i === 0 ? 'left' : 'right' });
    cx += cols[i];
  });
  y += 28;

  doc.font('Helvetica').fillColor('#111');
  order.items.forEach((it, idx) => {
    const rh = 30;
    if (idx % 2 === 1) doc.rect(48, y, pageW, rh).fill(LIGHT_BG);
    cx = 48;
    const cells = [it.name, String(it.qty), taka(it.price), taka(it.price * it.qty)];
    doc.fontSize(10);
    cells.forEach((c, i) => {
      doc
        .fillColor(i === 3 ? NAVY : '#111')
        .font(i === 3 ? 'Helvetica-Bold' : 'Helvetica')
        .text(c, cx + 8, y + 9, { width: cols[i] - 16, align: i === 0 ? 'left' : 'right' });
      cx += cols[i];
    });
    y += rh;
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = 48;
    }
  });

  // ---- totals ----
  y += 8;
  const tx = 48 + pageW - 220;
  const totalRow = (label: string, val: string, bold = false, big = false) => {
    doc
      .fontSize(big ? 14 : 11)
      .fillColor(bold ? NAVY : GRAY)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, tx, y, { width: 110 });
    doc
      .fillColor(bold ? ORANGE : '#111')
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(val, tx + 110, y, { width: 110, align: 'right' });
    y += big ? 24 : 18;
  };
  totalRow('Subtotal:', taka(order.subtotal));
  totalRow('Shipping:', order.shipping > 0 ? taka(order.shipping) : 'Free');
  if (order.discount > 0) totalRow('Discount:', `-${taka(order.discount)}`);
  doc.strokeColor('#e5e7eb').moveTo(tx, y).lineTo(tx + 220, y).stroke();
  y += 8;
  totalRow('Grand Total:', taka(order.total), true, true);

  // ---- footer ----
  const fy = doc.page.height - 90;
  doc.strokeColor('#e5e7eb').moveTo(48, fy - 16).lineTo(48 + pageW, fy - 16).stroke();
  doc
    .fontSize(9)
    .fillColor(GRAY)
    .font('Helvetica')
    .text('Thank you for shopping with Talukdar Shop!', 48, fy, { align: 'center', width: pageW })
    .text('Hotline: 16793 (Everyday 9:00 AM – 10:00 PM) | talukdarshop.com', 48, fy + 14, {
      align: 'center',
      width: pageW,
    })
    .text('This is a computer-generated invoice.', 48, fy + 28, { align: 'center', width: pageW });

  doc.end();
  return done;
}
