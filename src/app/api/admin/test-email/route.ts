import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';
import { sendEmail, isEmailConfigured } from '@/lib/email';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { to, debug } = (await req.json()) as { to?: string; debug?: boolean };
    if (debug) {
      const user = process.env.SMTP_USER || '';
      const pass = process.env.SMTP_APP_PASSWORD || '';
      return NextResponse.json({
        smtp_user_set: !!user,
        // mask: show first 2 + last 2 chars only
        smtp_user_masked: user ? `${user.slice(0, 2)}***${user.slice(-6)}` : '(not set)',
        smtp_user_length: user.length,
        smtp_pass_set: !!pass,
        smtp_pass_length: pass.length,
        smtp_pass_has_spaces: /\s/.test(pass),
      });
    }
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
    }).then(() => true).catch((e: Error) => {
      throw new Error(`SMTP error: ${e.message}`);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
