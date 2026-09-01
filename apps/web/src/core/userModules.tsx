import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createContext, use, useCallback, useMemo } from 'react';

import type { ModuleKey } from '@recodock/shared';
import { queryKeys, userModulesRepo } from '@recodock/shared';

import { supabase } from '../lib/supabase';
import { useAuth } from './auth';

/**
 * 追加済みモジュールの状態(CORE-02 / FR-01)。
 * モジュールは初期状態でカレンダーのみ。ユーザーが自分で追加していく設計。
 * 追加した順にサイドバーと iOS タブ(上位4件＋その他)へ並ぶ。
 */

/** コアモジュール。無効化・削除できない */
export const CORE_MODULE_KEY: ModuleKey = 'calendar';

interface UserModulesContextValue {
  /** 追加済みモジュール(表示順) */
  addedKeys: readonly ModuleKey[];
  isLoading: boolean;
  addModule: (moduleKey: ModuleKey) => void;
  removeModule: (moduleKey: ModuleKey) => void;
  /** 表示順を入れ替える(SC-05 の並び替え) */
  reorderModule: (moduleKey: ModuleKey, toIndex: number) => void;
}

const UserModulesContext = createContext<UserModulesContextValue | null>(null);

export interface UserModulesProviderProps {
  children: ReactNode;
}

export function UserModulesProvider({ children }: UserModulesProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.core.userModules(),
    queryFn: () => userModulesRepo.list(supabase),
    // 未ログインでは RLS で 0 件になるため、ログイン後にだけ取りにいく
    enabled: Boolean(user),
  });

  const addedKeys: readonly ModuleKey[] = useMemo(() => {
    const rows = (query.data ?? []).filter((row) => row.isEnabled);
    if (rows.length === 0) return [CORE_MODULE_KEY];
    const keys = [...rows].sort((a, b) => a.sortOrder - b.sortOrder).map((row) => row.moduleKey);
    // コアは必ず先頭に残す(FR-01)
    return keys.includes(CORE_MODULE_KEY) ? keys : [CORE_MODULE_KEY, ...keys];
  }, [query.data]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.core.userModules() });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: (moduleKey: ModuleKey) => {
      if (!user) throw new Error('ログインが必要です');
      return userModulesRepo.add(supabase, user.id, moduleKey, addedKeys.length);
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (moduleKey: ModuleKey) => userModulesRepo.setEnabled(supabase, moduleKey, false),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (moduleKeys: readonly ModuleKey[]) => userModulesRepo.reorder(supabase, moduleKeys),
    onSuccess: invalidate,
  });

  const addModule = useCallback(
    (moduleKey: ModuleKey) => {
      if (addedKeys.includes(moduleKey)) return;
      addMutation.mutate(moduleKey);
    },
    [addedKeys, addMutation],
  );

  const removeModule = useCallback(
    (moduleKey: ModuleKey) => {
      // コアは削除できない(FR-01)
      if (moduleKey === CORE_MODULE_KEY) return;
      removeMutation.mutate(moduleKey);
    },
    [removeMutation],
  );

  const reorderModule = useCallback(
    (moduleKey: ModuleKey, toIndex: number) => {
      const fromIndex = addedKeys.indexOf(moduleKey);
      if (fromIndex < 0 || toIndex < 0 || toIndex >= addedKeys.length) return;
      const next = [...addedKeys];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moduleKey);
      reorderMutation.mutate(next);
    },
    [addedKeys, reorderMutation],
  );

  const value = useMemo(
    () => ({ addedKeys, isLoading: query.isPending, addModule, removeModule, reorderModule }),
    [addedKeys, query.isPending, addModule, removeModule, reorderModule],
  );

  return <UserModulesContext value={value}>{children}</UserModulesContext>;
}

export function useUserModules(): UserModulesContextValue {
  const context = use(UserModulesContext);
  if (!context) throw new Error('useUserModules は UserModulesProvider の内側で使ってください');
  return context;
}
