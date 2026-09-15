import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateTransactionInput, TransactionRecord } from '@recodock/shared';
import {
  calcAccountBalance,
  formatAmount,
  formatListDate,
  moneyRepo,
  queryKeys,
  summarizeByCategory,
  summarizeTransactions,
} from '@recodock/shared';

import { monthDateRange, toBudgetMonth, toMonthKey } from '../../lib/monthRange';
import { supabase } from '../../lib/supabase';

/** MON-20 の集計カード。 */
export interface MoneyStat {
  id: string;
  label: string;
  value: string;
  sub: string;
}

/** カテゴリ別支出(構成比の内訳)。 */
export interface CategoryBreakdown {
  id: string;
  name: string;
  /** 構成比 0〜100 */
  percentage: number;
  amount: string;
}

/** 月推移の 1 本(収入／支出)。高さは 0〜100 の割合。 */
export interface TrendBar {
  label: string;
  incomeRatio: number;
  expenseRatio: number;
}

/** MON-21 取引一覧の 1 行。raw は MON-22 編集フォームへの受け渡しに使う。 */
export interface Transaction {
  id: string;
  date: string;
  category: string;
  memo: string;
  account: string;
  amount: string;
  isIncome: boolean;
  raw: TransactionRecord;
}

export type TransactionFilter = 'all' | 'expense' | 'transfer';

/** MON-21 の絞り込み(種別・口座・カテゴリ)。'all' は絞り込みなし。 */
export interface TransactionFilters {
  kind: TransactionFilter;
  accountId: string;
  categoryId: string;
}

/** 内訳に出すカテゴリの上限。これを超えると濃淡で区別できなくなる。 */
const CATEGORY_BREAKDOWN_LIMIT = 6;

export interface MoneySummaryResult {
  stats: readonly MoneyStat[];
  categories: readonly CategoryBreakdown[];
  trend: readonly TrendBar[];
  transactions: readonly Transaction[];
  totalCount: number;
  expenseTotal: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** 直近6か月の推移に使う月の並び。 */
function recentMonths(month: Date, count: number): Date[] {
  return Array.from(
    { length: count },
    (_, index) => new Date(month.getFullYear(), month.getMonth() - (count - 1 - index), 1),
  );
}

/** 月次サマリと取引一覧を返す(MON-20 / MON-21)。 */
export function useMoneySummary(month: Date, filters: TransactionFilters): MoneySummaryResult {
  const filter = filters.kind;
  const monthKey = toMonthKey(month);
  const range = monthDateRange(month);
  const trendMonths = recentMonths(month, 6);
  const trendStart = monthDateRange(trendMonths[0] ?? month).from;

  const transactionsQuery = useQuery({
    queryKey: queryKeys.money.transactions(monthKey),
    queryFn: () => moneyRepo.listTransactions(supabase, range.from, range.to),
  });

  const trendQuery = useQuery({
    queryKey: queryKeys.money.summary(monthKey),
    queryFn: () => moneyRepo.listTransactions(supabase, trendStart, range.to),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.money.categories(),
    queryFn: () => moneyRepo.listCategories(supabase),
  });

  const accountsQuery = useQuery({
    queryKey: queryKeys.money.accounts(),
    queryFn: () => moneyRepo.listAccounts(supabase),
  });

  const budgetsQuery = useQuery({
    queryKey: queryKeys.money.budgets(monthKey),
    queryFn: () => moneyRepo.listBudgets(supabase, toBudgetMonth(month)),
  });

  const all = transactionsQuery.data ?? [];
  const categoryRecords = categoriesQuery.data ?? [];
  const accountRecords = accountsQuery.data ?? [];
  const budgets = budgetsQuery.data ?? [];

  const categoryNames = new Map(categoryRecords.map((c) => [c.id, c.name]));
  const accountNames = new Map(accountRecords.map((a) => [a.id, a.name]));

  // 集計はドメイン関数に任せる(振替は収入・支出に計上しない: MON-05)
  const summary = summarizeTransactions(all);
  const byCategory = summarizeByCategory(all, 'expense');

  const budgetTotal = budgets.reduce((total, budget) => total + budget.amount, 0);
  const budgetRate = budgetTotal > 0 ? Math.round((summary.expense / budgetTotal) * 100) : 0;
  const remaining = Math.max(budgetTotal - summary.expense, 0);
  const savingRate = summary.income > 0 ? ((summary.net / summary.income) * 100).toFixed(1) : '0.0';

  const categories: CategoryBreakdown[] = [...byCategory]
    .map(([categoryId, amount]) => ({ categoryId: categoryId as string | null, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, CATEGORY_BREAKDOWN_LIMIT)
    .map((entry, index) => ({
      id: entry.categoryId ?? `uncategorized-${index}`,
      name: (entry.categoryId && categoryNames.get(entry.categoryId)) || '未分類',
      percentage: summary.expense > 0 ? Math.round((entry.amount / summary.expense) * 100) : 0,
      amount: entry.amount.toLocaleString('ja-JP'),
    }));

  // 月推移: 取得済みの6か月ぶんを月単位に畳む
  const trendSource = trendQuery.data ?? [];
  const monthlyTotals = trendMonths.map((trendMonth) => {
    const { from, to } = monthDateRange(trendMonth);
    const inMonth = trendSource.filter((tx) => tx.occurredOn >= from && tx.occurredOn <= to);
    return { month: trendMonth, ...summarizeTransactions(inMonth) };
  });
  const trendPeak = Math.max(1, ...monthlyTotals.flatMap((m) => [m.income, m.expense]));
  const trend: TrendBar[] = monthlyTotals.map((m) => ({
    label: `${m.month.getMonth() + 1}月`,
    incomeRatio: Math.round((m.income / trendPeak) * 100),
    expenseRatio: Math.round((m.expense / trendPeak) * 100),
  }));

  const filtered = all.filter((tx) => {
    if (filter === 'transfer' && tx.kind !== 'transfer') return false;
    if (filter === 'expense' && tx.kind !== 'expense') return false;
    if (filters.accountId !== 'all' && tx.accountId !== filters.accountId) return false;
    if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) return false;
    return true;
  });

  const transactions: Transaction[] = filtered.map((tx) => ({
    id: tx.id,
    date: formatListDate(new Date(`${tx.occurredOn}T00:00:00`)),
    category:
      tx.kind === 'transfer'
        ? '振替'
        : (tx.categoryId && categoryNames.get(tx.categoryId)) || '未分類',
    memo: tx.memo ?? '',
    account: accountNames.get(tx.accountId) ?? '',
    amount: formatAmount(tx.kind === 'income' ? tx.amount : -tx.amount, {
      showsPlusSign: tx.kind === 'income',
    }),
    isIncome: tx.kind === 'income',
    raw: tx,
  }));

  const previousNet = monthlyTotals[monthlyTotals.length - 2];
  const expenseDiff = previousNet ? summary.expense - previousNet.expense : 0;
  const incomeDiff = previousNet ? summary.income - previousNet.income : 0;

  return {
    stats: [
      {
        id: 'income',
        label: '収入',
        value: formatAmount(summary.income),
        sub: `前月比 ${incomeDiff === 0 ? '±0' : formatAmount(incomeDiff, { showsPlusSign: true })}`,
      },
      {
        id: 'expense',
        label: '支出',
        value: formatAmount(summary.expense),
        sub: `前月比 ${expenseDiff === 0 ? '±0' : formatAmount(expenseDiff, { showsPlusSign: true })}`,
      },
      {
        id: 'net',
        label: '収支',
        value: formatAmount(summary.net, { showsPlusSign: true }),
        sub: `貯蓄率 ${savingRate}%`,
      },
      {
        id: 'budget',
        label: '予算消化率',
        value: budgetTotal > 0 ? `${budgetRate}%` : '—',
        sub: budgetTotal > 0 ? `残り ${formatAmount(remaining)}` : '予算が未設定です',
      },
    ],
    categories,
    trend,
    transactions,
    totalCount: all.length,
    expenseTotal: summary.expense.toLocaleString('ja-JP'),
    isLoading:
      transactionsQuery.isPending ||
      categoriesQuery.isPending ||
      accountsQuery.isPending ||
      budgetsQuery.isPending,
    isError:
      transactionsQuery.isError ||
      categoriesQuery.isError ||
      accountsQuery.isError ||
      budgetsQuery.isError,
    refetch: () => {
      void transactionsQuery.refetch();
      void trendQuery.refetch();
    },
  };
}

/** 口座残高(MON-02)。開始残高 + 取引の積み上げで導出する。 */
export function useAccountBalances(month: Date): ReadonlyMap<string, number> {
  const range = monthDateRange(month);
  const accountsQuery = useQuery({
    queryKey: queryKeys.money.accounts(),
    queryFn: () => moneyRepo.listAccounts(supabase),
  });
  const transactionsQuery = useQuery({
    queryKey: queryKeys.money.transactions(toMonthKey(month)),
    queryFn: () => moneyRepo.listTransactions(supabase, range.from, range.to),
  });

  const balances = new Map<string, number>();
  for (const account of accountsQuery.data ?? []) {
    balances.set(
      account.id,
      calcAccountBalance(account.id, account.initialBalance, transactionsQuery.data ?? []),
    );
  }
  return balances;
}

/** 取引を追加する(MON-22)。 */
export function useCreateTransaction(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<TransactionRecord, Error, Omit<CreateTransactionInput, 'ledgerId'>>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('ログインが必要です');
      const ledger = await moneyRepo.getOrCreateLedger(supabase, userId);
      return moneyRepo.createTransaction(supabase, userId, { ...input, ledgerId: ledger.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['money'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 取引を更新する(MON-22 の編集)。 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { transactionId: string; input: Parameters<typeof moneyRepo.updateTransaction>[2] }
  >({
    mutationFn: ({ transactionId, input }) =>
      moneyRepo.updateTransaction(supabase, transactionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['money'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 取引を削除する。 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (transactionId) => moneyRepo.removeTransaction(supabase, transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['money'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

export interface MoneyAccountsResult {
  accounts: readonly { id: string; name: string }[];
  isLoading: boolean;
}

/** 取引の登録先に使う口座一覧(MON-02)。 */
export function useMoneyAccounts(): MoneyAccountsResult {
  const query = useQuery({
    queryKey: queryKeys.money.accounts(),
    queryFn: () => moneyRepo.listAccounts(supabase),
  });
  return {
    accounts: (query.data ?? []).filter((account) => !account.isArchived),
    isLoading: query.isPending,
  };
}

export interface MoneyCategoriesResult {
  categories: readonly { id: string; name: string; kind: 'income' | 'expense' }[];
  isLoading: boolean;
}

/** 取引に付けるカテゴリ一覧(MON-03)。 */
export function useMoneyCategories(): MoneyCategoriesResult {
  const query = useQuery({
    queryKey: queryKeys.money.categories(),
    queryFn: () => moneyRepo.listCategories(supabase),
  });
  return { categories: query.data ?? [], isLoading: query.isPending };
}
