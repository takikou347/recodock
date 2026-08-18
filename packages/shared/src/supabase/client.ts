// supabase-js を import してよいのはデータアクセス層(src/supabase, src/data)のみ(ADR-0004)。
// ESLint の no-restricted-imports でリポジトリ全体に強制している。
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../database.types';

export type RecodockClient = SupabaseClient<Database>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * プラットフォーム(Web / iOS)側で環境変数から設定を渡してクライアントを生成する。
 * anon キーは RLS 前提で公開可(NFR-S7)。service_role をここに渡してはならない。
 */
export function createSupabaseClient(config: SupabaseConfig): RecodockClient {
  return createClient<Database>(config.url, config.anonKey);
}
