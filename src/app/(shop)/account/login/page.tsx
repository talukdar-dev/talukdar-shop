'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { friendlyAuthError, useAuth } from '@/lib/auth';
import { IconUser } from '@/components/store/icons';

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.7 3.4 2.6.2.1c2.2-2 3.9-5 3.9-9.4z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.7.1-3 2.3v.7C3.5 21.3 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.8-3-2.3-.5.2C.6 8.6 0 10.2 0 12s.6 3.4 1.7 4.9l3.5-2.5z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.7 1.7 6.6l3.5 2.7c1-2.9 3.7-4.6 6.8-4.6z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/account');
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email, password);
      router.push('/account');
    } catch (err: unknown) {
      setError(friendlyAuthError((err as { code?: string })?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push('/account');
    } catch (err: unknown) {
      setError(friendlyAuthError((err as { code?: string })?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-md border border-[#e8e8e8] p-6 sm:p-8">
        <span className="mx-auto w-14 h-14 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
          <IconUser className="w-7 h-7" />
        </span>
        <h1 className="text-[20px] font-bold text-center mb-1">Account Login</h1>
        <p className="text-[12.5px] text-ink text-center mb-5">
          Login to track orders and checkout faster.
        </p>
        {!configured && (
          <p className="mb-3 text-[13px] bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-3 py-2">
            Firebase is not configured yet. Add the Firebase keys to <code>.env.local</code>.
          </p>
        )}
        {error && (
          <p className="mb-3 text-[13px] bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={google}
          disabled={busy || !configured}
          className="w-full h-11 mb-3 border border-gray-300 rounded-md text-[14px] font-semibold text-gray-700 hover:border-brand hover:text-brand disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-[12px] text-gray-400 font-semibold">OR</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            aria-label="Email address"
            className="w-full h-11 px-3 border border-gray-300 rounded-md text-[14px] outline-none focus:border-brand"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            aria-label="Password"
            className="w-full h-11 px-3 border border-gray-300 rounded-md text-[14px] outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={busy || !configured}
            className="w-full h-11 bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md uppercase tracking-wide disabled:opacity-50 transition-colors"
          >
            {busy ? 'Please wait…' : 'Login'}
          </button>
        </form>
        <p className="text-[13px] text-ink text-center mt-5">
          New customer?{' '}
          <Link href="/account/register" className="text-link font-bold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
