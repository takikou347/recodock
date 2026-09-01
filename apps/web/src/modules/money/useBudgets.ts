import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { moneyRepo, queryKeys, summarizeByCategory, summarizeTransactions } from '@recodock/shared';

import { monthDateRange, toBudgetMonth, toMonthKey } from '../../lib/monthRange';
import { supabase } from '../../lib/supabase';

export interface BudgetCategoryRow {
  categoryId: string | null;
  name: string;
  amount: number;
}

export interface BudgetStatusResult {
  /** 帳簿全体の予算(category_id が NULL の行) */
  totalBudget: number;
  expense: number;
  /** 消化率(0〜)。予算未設定なら 0 */
  rate: number;
  remaining: number;
  categoryRows: readonly BudgetCategoryRow[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** 予算と消化率(MON-06)。 */
export function useBudgetStatus(month: Date): BudgetStatusResult {
  const monthKey = toMonthKey(month);
  const range = monthDateRange(month);

  const budgetsQuery = useQuery({
    queryKey: queryKeys.money.budgets(monthKey),
    queryFn: () => moneyRepo.listBudgets(supabase, toBudgetMonth(month)),
  });
  const transactionsQuery = useQuery({
    queryKey: queryKeys.money.transactions(monthKey),
    queryFn: () => moneyRepo.listTransactions(supabase, range.from, range.to),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.money.categories(),
    queryFn: () => moneyRepo.listCategories(supabase),
  });

  const transactions = transactionsQuery.data ?? [];
  const summary = summarizeTransactions(transactions);
  const totalBudget = (budgetsQuery.data ?? [])
    .filter((budget) => budget.categoryId === null)
    .reduce((total, budget) => total + budget.amount, 0);

  const names = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category.name]),
  );
  const categoryRows: BudgetCategoryRow[] = [...summarizeByCategory(transactions, 'expense')]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: names.get(categoryId) ?? '未分類',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalBudget,
    expense: summary.expense,
    rate: totalBudget > 0 ? Math.round((summary.expense / totalBudget) * 100) : 0,
    remaining: Math.max(totalBudget - summary.expense, 0),
    categoryRows,
    isLoading: budgetsQuery.isPending || transactionsQuery.isPending,
    isError: budgetsQuery.isError || transactionsQuery.isError,
    refetch: () => {
      void budgetsQuery.refetch();
      void transactionsQuery.refetch();
    },
  };
}

/** 予算を保存する(MON-26)。同じ月×カテゴリは上書きされる。 */
export function useSaveBudget(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { month: Date; categoryId: string | null; amount: number }>({
    mutationFn: async ({ month, categoryId, amount }) => {
      if (!userId) throw new Error('ログインが必要です');
      const ledger = await moneyRepo.getOrCreateLedger(supabase, userId);
      await moneyRepo.upsertBudget(supabase, userId, ledger.id, {
        month: toBudgetMonth(month),
        categoryId,
        amount,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['money'] }),
  });
}
