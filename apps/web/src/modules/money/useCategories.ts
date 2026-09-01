import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CategoryRecord } from '@recodock/shared';
import { moneyRepo, queryKeys } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

export interface CategoryGroupsResult {
  expenseCategories: readonly CategoryRecord[];
  incomeCategories: readonly CategoryRecord[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** カテゴリを支出用・収入用に分けて返す(MON-25)。 */
export function useCategoryGroups(): CategoryGroupsResult {
  const query = useQuery({
    queryKey: queryKeys.money.categories(),
    queryFn: () => moneyRepo.listCategories(supabase),
  });
  const all = query.data ?? [];
  return {
    expenseCategories: all.filter((category) => category.kind === 'expense'),
    incomeCategories: all.filter((category) => category.kind === 'income'),
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

export interface CategoryActions {
  addCategory: (name: string, kind: 'expense' | 'income') => Promise<void>;
  rename: (categoryId: string, name: string) => Promise<void>;
  /** 同じ種類の中で 1 つ上/下へ動かす */
  move: (category: CategoryRecord, direction: -1 | 1) => Promise<void>;
  remove: (categoryId: string) => Promise<void>;
}

/** カテゴリの追加・名称変更・並び替え・削除(MON-25/MON-03)。 */
export function useCategoryActions(userId: string | undefined): CategoryActions {
  const queryClient = useQueryClient();
  const { expenseCategories, incomeCategories } = useCategoryGroups();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['money'] });

  const mutation = useMutation<void, Error, () => Promise<void>>({
    mutationFn: (operation) => operation(),
    onSuccess: () => void invalidate(),
  });

  return {
    addCategory: (name, kind) =>
      mutation.mutateAsync(async () => {
        if (!userId) throw new Error('ログインが必要です');
        const ledger = await moneyRepo.getOrCreateLedger(supabase, userId);
        const siblings = kind === 'expense' ? expenseCategories : incomeCategories;
        await moneyRepo.createCategory(supabase, userId, ledger.id, {
          name,
          kind,
          sortOrder: siblings.length,
        });
      }),
    rename: (categoryId, name) =>
      mutation.mutateAsync(() => moneyRepo.renameCategory(supabase, categoryId, name)),
    move: (category, direction) =>
      mutation.mutateAsync(async () => {
        const siblings = category.kind === 'expense' ? expenseCategories : incomeCategories;
        const index = siblings.findIndex((sibling) => sibling.id === category.id);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
        const next = [...siblings];
        next.splice(index, 1);
        next.splice(targetIndex, 0, category);
        await moneyRepo.reorderCategories(
          supabase,
          next.map((sibling) => sibling.id),
        );
      }),
    remove: (categoryId) =>
      mutation.mutateAsync(() => moneyRepo.removeCategory(supabase, categoryId)),
  };
}
