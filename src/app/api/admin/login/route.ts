import { NextResponse } from 'next/server';
import { checkPassword, setAdminCookie } from '@/lib/admin-auth';


export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }
    let ok: boolean;
    try {
      ok = checkPassword(password);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Auth not configured' },
        { status: 500 },
      );
    }
    if (!ok) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }
    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
