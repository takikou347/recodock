import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AccountRecord } from '@recodock/shared';
import { calcAccountBalance, moneyRepo, queryKeys } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

/** MON-23 の 1 行。現在残高 = 開始残高 + 全取引の積み上げ(MON-02)。 */
export interface AccountWithBalance extends AccountRecord {
  balance: number;
}

export interface AccountFormValue {
  accountId?: string;
  name: string;
  kind: AccountRecord['kind'];
  initialBalance: number;
}

/** 残高計算の対象範囲。全取引を見る(残高は累積であって月次ではない)。 */
const BALANCE_RANGE = { from: '1970-01-01', to: '2999-12-31' } as const;

export interface AccountsWithBalanceResult {
  accounts: readonly AccountWithBalance[];
  totalBalance: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** 口座一覧と現在残高(MON-23)。 */
export function useAccountsWithBalance(): AccountsWithBalanceResult {
  const accountsQuery = useQuery({
    queryKey: queryKeys.money.accounts(),
    queryFn: () => moneyRepo.listAccounts(supabase),
  });
  const transactionsQuery = useQuery({
    queryKey: queryKeys.money.transactions('all'),
    queryFn: () => moneyRepo.listTransactions(supabase, BALANCE_RANGE.from, BALANCE_RANGE.to),
  });

  const transactions = transactionsQuery.data ?? [];
  const accounts = (accountsQuery.data ?? [])
    .filter((account) => !account.isArchived)
    .map((account) => ({
      ...account,
      balance: calcAccountBalance(account.id, account.initialBalance, transactions),
    }));

  return {
    accounts,
    totalBalance: accounts.reduce((total, account) => total + account.balance, 0),
    isLoading: accountsQuery.isPending || transactionsQuery.isPending,
    isError: accountsQuery.isError || transactionsQuery.isError,
    refetch: () => {
      void accountsQuery.refetch();
      void transactionsQuery.refetch();
    },
  };
}

/** 口座を作成・更新する(MON-24)。 */
export function useSaveAccount(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, AccountFormValue>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('ログインが必要です');
      if (input.accountId) {
        await moneyRepo.updateAccount(supabase, input.accountId, {
          name: input.name,
          kind: input.kind,
          initialBalance: input.initialBalance,
        });
        return;
      }
      const ledger = await moneyRepo.getOrCreateLedger(supabase, userId);
      await moneyRepo.createAccount(supabase, userId, ledger.id, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['money'] }),
  });
}
