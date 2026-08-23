// データアクセス層のサンプル実装(モジュール有効状態: CORE-02)。
// 他テーブルのリポジトリ関数もこのパターン(クライアントを引数に取る純関数)で追加していく。
// UI は supabase-js を直接呼ばず、必ずこの層を経由する(ADR-0004)。
import type { ModuleKey } from '../modules/types';
import type { RecodockClient } from '../supabase/client';

export interface UserModule {
  moduleKey: ModuleKey;
  isEnabled: boolean;
  sortOrder: number;
}

/** 有効/無効を含む全モジュールの状態を表示順で取得する(SC-05) */
export async function list(client: RecodockClient): Promise<UserModule[]> {
  const { data, error } = await client
    .from('user_modules')
    .select('module_key, is_enabled, sort_order')
    .order('sort_order');
  if (error) throw error;
  return data.map((row) => ({
    moduleKey: row.module_key as ModuleKey,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
  }));
}

/** モジュールの有効/無効を切り替える(FR-01: 無効化してもデータは保持) */
export async function setEnabled(
  client: RecodockClient,
  moduleKey: ModuleKey,
  isEnabled: boolean,
): Promise<void> {
  const { error } = await client
    .from('user_modules')
    .update({ is_enabled: isEnabled })
    .eq('module_key', moduleKey);
  if (error) throw error;
}
