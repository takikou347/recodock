// アプリ設定(user_settings)のリポジトリ関数。key/value(jsonb)で持つ。
import type { RecodockClient } from '../supabase/client';
import { toAppError, unwrapVoid } from './errors';

/** 画面で扱う設定キー。DB は任意の key を許すが、UI が使うものはここに集める。 */
export type UserSettingKey = 'biometric_lock' | 'notifications';

/** 設定を key → 値(真偽値)の形で読む。未設定のキーは既定値にフォールバックする。 */
export async function listFlags(
  client: RecodockClient,
): Promise<Partial<Record<UserSettingKey, boolean>>> {
  const { data, error } = await client.from('user_settings').select('key, value');
  if (error) throw toAppError(error);

  const flags: Partial<Record<UserSettingKey, boolean>> = {};
  for (const row of data ?? []) {
    if (typeof row.value === 'boolean') flags[row.key as UserSettingKey] = row.value;
  }
  return flags;
}

/** 設定を保存する。同じ key があれば上書きする。 */
export async function setFlag(
  client: RecodockClient,
  userId: string,
  key: UserSettingKey,
  value: boolean,
): Promise<void> {
  unwrapVoid(
    await client
      .from('user_settings')
      .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' }),
  );
}
