import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UserSettingKey } from '@recodock/shared';
import { userSettingsRepo } from '@recodock/shared';

import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { Toggle } from '../components/Toggle';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth';

import layout from './pageLayout.module.css';
import styles from './SettingsPage.module.css';

/**
 * 設定の既定値。未設定のキーはこの値で表示する。
 * 生体認証ロック(NFR-S6)は端末ローカル設定で DB に持たず、Web は対象外のためここには出さない
 * (02_data_model.md 3.1)。
 */
const DEFAULT_FLAGS: Readonly<Partial<Record<UserSettingKey, boolean>>> = {
  notifications: true,
};

const SETTINGS_QUERY_KEY = ['core', 'userSettings'] as const;

/**
 * アプリ設定。デザインでは iOS の「その他」タブに項目が定義されているため、
 * 同じ項目を Web の設定画面として並べている。値は user_settings に保存する。
 */
export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => userSettingsRepo.listFlags(supabase),
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: UserSettingKey; value: boolean }) => {
      if (!user) throw new Error('ログインが必要です');
      return userSettingsRepo.setFlag(supabase, user.id, key, value);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
  });

  const flags = { ...DEFAULT_FLAGS, ...(query.data ?? {}) };
  const isNotificationsOn = flags.notifications ?? true;

  return (
    <div className={layout.page}>
      <h1 className={layout.titleSm}>設定</h1>

      {query.isError ? (
        <ErrorState
          title="設定を読み込めませんでした"
          description="接続を確認してください。"
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <Skeleton lineCount={3} />
      ) : (
        <Card isFlush>
          <div className={styles.row}>
            <span className={styles.label}>通知設定</span>
            <Toggle
              isOn={isNotificationsOn}
              ariaLabel="通知設定"
              onChange={(value) => mutation.mutate({ key: 'notifications', value })}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>データエクスポート</span>
            <span className={styles.meta}>ZIP</span>
          </div>
        </Card>
      )}
    </div>
  );
}
