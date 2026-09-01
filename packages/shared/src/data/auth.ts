// 認証(SC-01〜03)。supabase-js を使ってよいのはこの層のみ(ADR-0004)。
// 認可の境界は RLS であり、ここは UX のための入り口にすぎない(NFR-S3)。
import type { RecodockClient } from '../supabase/client';
import { toAppError } from './errors';

/** UI が扱うログイン中のユーザー。 */
export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

interface SupabaseUserLike {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string | null; name?: string | null } | null;
}

function toAuthUser(user: SupabaseUserLike | null | undefined): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: metadata.full_name ?? metadata.name ?? null,
  };
}

/** 現在のセッションのユーザーを返す。未ログインなら null。 */
export async function getCurrentUser(client: RecodockClient): Promise<AuthUser | null> {
  const { data, error } = await client.auth.getSession();
  if (error) throw toAppError(error);
  return toAuthUser(data.session?.user);
}

/** メール＋パスワードでログインする(SC-01)。 */
export async function signInWithPassword(
  client: RecodockClient,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw toAppError(error);
  const user = toAuthUser(data.user);
  if (!user) throw toAppError({ code: 'PGRST301', message: 'ログインに失敗しました' });
  return user;
}

/** 新規登録する(SC-02)。確認メール運用ではセッションが張られないことがある。 */
export async function signUpWithPassword(
  client: RecodockClient,
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw toAppError(error);
  return toAuthUser(data.user);
}

/** Google で続ける(SC-01)。リダイレクト先は呼び出し側が渡す。 */
export async function signInWithGoogle(client: RecodockClient, redirectTo: string): Promise<void> {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw toAppError(error);
}

/** ログアウトする。 */
export async function signOut(client: RecodockClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw toAppError(error);
}

/**
 * 認証状態の変化を購読する。返り値を呼ぶと購読を解除する。
 * UI 側は useEffect(外部システムとの同期)から使う。
 */
export function onAuthStateChange(
  client: RecodockClient,
  listener: (user: AuthUser | null) => void,
): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    listener(toAuthUser(session?.user));
  });
  return () => data.subscription.unsubscribe();
}
