// 家計簿ドメインロジック(テスト最優先領域。docs/recodock/02_design/06_test_policy.md 1.2)。
// DB スキーマの詳細(docs/recodock/02_design/02_data_model.md 3.3)から独立した純粋関数として実装し、
// Web / iOS / Edge Functions で共有する(NFR-E1)。

export type TransactionKind = 'income' | 'expense' | 'transfer';

/** 集計・残高計算に必要な最小の取引表現。DB の transactions 行から変換して渡す */
export interface TransactionLike {
  kind: TransactionKind;
  /** 常に正の金額(符号は kind で解釈する) */
  amount: number;
  /** 対象口座(振替では出金元) */
  accountId: string;
  /** 振替の入金先(kind === 'transfer' のときのみ) */
  transferAccountId?: string | null;
  categoryId?: string | null;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  /** income - expense。振替は含まない(MON-05) */
  net: number;
}

/**
 * 月次集計(MON-04)。振替は収入・支出のどちらにも計上しない(MON-05)。
 */
export function summarizeTransactions(transactions: readonly TransactionLike[]): MonthlySummary {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.kind === 'income') income += tx.amount;
    if (tx.kind === 'expense') expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

/**
 * 口座残高(MON-02)。残高カラムは持たず「開始残高 + 取引の積み上げ」で導出する
 * (docs/recodock/02_design/02_data_model.md 3.3 accounts)。
 * 振替は出金元からマイナス、入金先にプラス。
 */
export function calcAccountBalance(
  accountId: string,
  initialBalance: number,
  transactions: readonly TransactionLike[],
): number {
  let balance = initialBalance;
  for (const tx of transactions) {
    switch (tx.kind) {
      case 'income':
        if (tx.accountId === accountId) balance += tx.amount;
        break;
      case 'expense':
        if (tx.accountId === accountId) balance -= tx.amount;
        break;
      case 'transfer':
        if (tx.accountId === accountId) balance -= tx.amount;
        if (tx.transferAccountId === accountId) balance += tx.amount;
        break;
    }
  }
  return balance;
}

/**
 * カテゴリ別集計(MON-04)。振替(categoryId なし)は対象外。
 * 返り値は categoryId → 合計金額。
 */
export function summarizeByCategory(
  transactions: readonly TransactionLike[],
  kind: 'income' | 'expense',
): Map<string, number> {
  const result = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind !== kind || tx.categoryId == null) continue;
    result.set(tx.categoryId, (result.get(tx.categoryId) ?? 0) + tx.amount);
  }
  return result;
}
