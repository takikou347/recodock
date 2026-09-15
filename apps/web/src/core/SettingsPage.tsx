import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UserSettingKey } from '@recodock/shared';
import { userSettingsRepo } from '@recodock/shared';

import { useAuth } from './auth';

import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { Toggle } from '@/components/Toggle';
import { Card } from '@/components/ui/card';
import { Page, PageHeader } from '@/core/PageLayout';
import { supabase } from '@/lib/supabase';

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
 * アプリ設定。値は user_settings に保存する。
 * データエクスポートは未実装のため項目を出さない(実装は Phase 8)。
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
    <Page className="max-w-2xl">
      <PageHeader title="設定" />

      {query.isError ? (
        <ErrorState
          title="設定を読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <Skeleton lineCount={3} />
      ) : (
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">通知</p>
              <p className="text-muted-foreground text-xs">予定のリマインドを受け取る</p>
            </div>
            <Toggle
              isOn={isNotificationsOn}
              ariaLabel="通知"
              isDisabled={mutation.isPending}
              onChange={(value) => mutation.mutate({ key: 'notifications', value })}
            />
          </div>
        </Card>
      )}
    </Page>
  );
}
