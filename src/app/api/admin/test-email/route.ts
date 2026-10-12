import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';
import { sendEmail, isEmailConfigured } from '@/lib/email';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { to } = (await req.json()) as { to?: string };
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Valid email address required.' }, { status: 400 });
    }
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'SMTP not configured. Add SMTP_USER and SMTP_APP_PASSWORD env vars on Vercel and redeploy.' },
        { status: 400 },
      );
    }
    const ok = await sendEmail({
      to,
      subject: 'Test Email — Talukdar Shop',
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
        <h1 style="color:#0a1633">Email is working! ✅</h1>
        <p style="color:#555">This is a test email from your Talukdar Shop store. Order notification emails (received / confirmed / cancelled) will be sent from <strong>shipontalukdar699@gmail.com</strong>.</p>
        <p style="color:#888;font-size:12px">Sent at ${new Date().toLocaleString()}</p>
      </body></html>`,
    });
    if (!ok) {
      return NextResponse.json({ error: 'SMTP send failed. Check app password (no spaces) and Gmail settings.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
