import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Me } from '../lib/types';

interface AuthState {
  session: Session | null;
  me: Me | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  /** Redirects to Google, then back to `redirectPath` on this site. */
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (s: Session | null) => {
    if (!s) {
      setMe(null);
      return;
    }
    try {
      setMe(await api.me());
    } catch {
      // backend unreachable — still treat as logged-in customer
      const meta = s.user.user_metadata ?? {};
      setMe({ id: s.user.id, email: s.user.email, role: 'customer', fullName: meta.full_name ?? meta.name ?? '' });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadMe(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // defer: calling supabase inside this callback can deadlock
        setTimeout(() => loadMe(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadMe]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    await loadMe(data.session);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      await loadMe(data.session);
    }
    return { needsConfirmation: !data.session };
  };

  const signInWithGoogle = async (redirectPath = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Come back via /login so errors are shown there; on success it forwards to redirectPath
        redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirectPath)}`,
        queryParams: { prompt: 'select_account' }, // let people pick which Google account
      },
    });
    if (error) throw error;
    // the browser now navigates to Google; on return, onAuthStateChange fires SIGNED_IN
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMe(null);
  };

  return (
    <AuthContext.Provider value={{ session, me, isAdmin: me?.role === 'admin', loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
