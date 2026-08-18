import { createSupabaseClient } from '@recodock/shared';

// Web 用の Supabase クライアント。UI からはデータアクセス層(@recodock/shared)経由で使う。
export const supabase = createSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
