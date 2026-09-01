import type { ReactNode } from 'react';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { authRepo, type AuthUser } from '@recodock/shared';

import { supabase } from '../lib/supabase';

/**
 * 認証状態(SC-01〜03)。認可の境界は RLS であり、ここは画面の出し分けのための状態(NFR-S3)。
 */
interface AuthContextValue {
  user: AuthUser | null;
  /** 初回のセッション復元が終わるまで true */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 外部システム(Supabase のセッション)との同期
  useEffect(() => {
    let isMounted = true;

    authRepo
      .getCurrentUser(supabase)
      .then((current) => {
        if (isMounted) setUser(current);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = authRepo.onAuthStateChange(supabase, (next) => {
      if (isMounted) setUser(next);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authRepo.signInWithPassword(supabase, email, password));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setUser(await authRepo.signUpWithPassword(supabase, email, password));
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authRepo.signInWithGoogle(supabase, `${window.location.origin}/`);
  }, []);

  const signOut = useCallback(async () => {
    await authRepo.signOut(supabase);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signInWithGoogle, signOut }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth は AuthProvider の内側で使ってください');
  return context;
}
