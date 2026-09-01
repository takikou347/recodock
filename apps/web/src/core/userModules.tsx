import type { ReactNode } from 'react';
import { createContext, use, useCallback, useMemo, useState } from 'react';

import type { ModuleKey } from '@recodock/shared';

/**
 * 追加済みモジュールの状態(CORE-02 / FR-01)。
 * モジュールは初期状態でカレンダーのみ。ユーザーが自分で追加していく設計。
 * 追加した順にサイドバーと iOS タブ(上位4件＋その他)へ並ぶ。
 *
 * TODO: userModulesRepo(@recodock/shared)＋TanStack Query に差し替える。
 * 現在は画面デザイン実装のため、デザイン(Recodock Screens.dc.html)の既定状態を初期値に持つ。
 */

/** コアモジュール。無効化・削除できない */
export const CORE_MODULE_KEY: ModuleKey = 'calendar';

const DEFAULT_ADDED_MODULES: readonly ModuleKey[] = ['calendar', 'money', 'diary', 'map'];

interface UserModulesContextValue {
  /** 追加済みモジュール(表示順) */
  addedKeys: readonly ModuleKey[];
  addModule: (moduleKey: ModuleKey) => void;
  removeModule: (moduleKey: ModuleKey) => void;
  /** 表示順を入れ替える(SC-05 の並び替え) */
  reorderModule: (moduleKey: ModuleKey, toIndex: number) => void;
}

const UserModulesContext = createContext<UserModulesContextValue | null>(null);

export interface UserModulesProviderProps {
  children: ReactNode;
  /** テスト・初回起動デモ用に初期状態を差し替える */
  initialKeys?: readonly ModuleKey[];
}

export function UserModulesProvider({ children, initialKeys }: UserModulesProviderProps) {
  const [addedKeys, setAddedKeys] = useState<readonly ModuleKey[]>(
    initialKeys ?? DEFAULT_ADDED_MODULES,
  );

  const addModule = useCallback((moduleKey: ModuleKey) => {
    setAddedKeys((keys) => (keys.includes(moduleKey) ? keys : [...keys, moduleKey]));
  }, []);

  const removeModule = useCallback((moduleKey: ModuleKey) => {
    // コアは削除できない(FR-01)
    if (moduleKey === CORE_MODULE_KEY) return;
    setAddedKeys((keys) => keys.filter((key) => key !== moduleKey));
  }, []);

  const reorderModule = useCallback((moduleKey: ModuleKey, toIndex: number) => {
    setAddedKeys((keys) => {
      const fromIndex = keys.indexOf(moduleKey);
      if (fromIndex < 0 || toIndex < 0 || toIndex >= keys.length) return keys;
      const next = [...keys];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moduleKey);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ addedKeys, addModule, removeModule, reorderModule }),
    [addedKeys, addModule, removeModule, reorderModule],
  );

  return <UserModulesContext value={value}>{children}</UserModulesContext>;
}

export function useUserModules(): UserModulesContextValue {
  const context = use(UserModulesContext);
  if (!context) throw new Error('useUserModules は UserModulesProvider の内側で使ってください');
  return context;
}
