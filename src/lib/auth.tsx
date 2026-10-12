'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Wrong email or password. Please try again.';
    case 'auth/email-already-in-use': return 'This email is already registered. Please login instead.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked': return 'Popup was blocked. Please allow popups and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable it in the Firebase console.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it in Firebase console -> Authentication -> Settings.';
    case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a bit and try again.';
    default: return 'Something went wrong. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    setConfigured(!!auth);
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const requireAuth = useCallback(() => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured.');
    return auth;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = requireAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, [requireAuth]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = requireAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    [requireAuth],
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = requireAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    },
    [requireAuth],
  );

  const logout = useCallback(async () => {
    const auth = requireAuth();
    await signOut(auth);
  }, [requireAuth]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }),
    [user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
