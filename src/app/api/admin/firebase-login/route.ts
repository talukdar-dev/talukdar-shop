import { NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/admin-auth';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Admin login via Firebase Google sign-in.
 * Client sends the Firebase ID token; we verify it with Google's
 * tokeninfo endpoint and check the email is in ADMIN_EMAILS.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    const verify = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: 'no-store' },
    );
    if (!verify.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }
    const info = (await verify.json()) as {
      email?: string;
      email_verified?: string;
      aud?: string;
    };

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId || info.aud !== projectId) {
      return NextResponse.json({ error: 'Token is not for this project' }, { status: 401 });
    }
    if (info.email_verified !== 'true') {
      return NextResponse.json(
        { error: 'Please verify your email address first' },
        { status: 403 },
      );
    }
    const email = (info.email || '').toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      return NextResponse.json(
        { error: 'This Google account is not an admin' },
        { status: 403 },
      );
    }

    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
