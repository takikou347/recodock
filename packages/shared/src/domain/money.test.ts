import { describe, expect, it } from 'vitest';

import {
  calcAccountBalance,
  summarizeByCategory,
  summarizeTransactions,
  type TransactionLike,
} from './money';

const tx = (partial: Partial<TransactionLike> & Pick<TransactionLike, 'kind' | 'amount'>) => ({
  accountId: 'bank',
  transferAccountId: null,
  categoryId: null,
  ...partial,
});

describe('summarizeTransactions(MON-04)', () => {
  it('収入と支出を集計し net を返す', () => {
    const result = summarizeTransactions([
      tx({ kind: 'income', amount: 300000 }),
      tx({ kind: 'expense', amount: 1200 }),
      tx({ kind: 'expense', amount: 800 }),
    ]);
    expect(result).toEqual({ income: 300000, expense: 2000, net: 298000 });
  });

  it('振替は収入・支出のどちらにも計上しない(MON-05)', () => {
    const result = summarizeTransactions([
      tx({ kind: 'expense', amount: 500 }),
      tx({ kind: 'transfer', amount: 10000, accountId: 'bank', transferAccountId: 'cash' }),
    ]);
    expect(result).toEqual({ income: 0, expense: 500, net: -500 });
  });

  it('取引がなければすべて 0', () => {
    expect(summarizeTransactions([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe('calcAccountBalance(MON-02, MON-05)', () => {
  it('開始残高に収入・支出を積み上げる', () => {
    const balance = calcAccountBalance('bank', 1000, [
      tx({ kind: 'income', amount: 500, accountId: 'bank' }),
      tx({ kind: 'expense', amount: 300, accountId: 'bank' }),
      tx({ kind: 'expense', amount: 9999, accountId: 'cash' }),
    ]);
    expect(balance).toBe(1200);
  });

  it('振替は出金元からマイナス・入金先にプラス(US-M4)', () => {
    const transactions = [
      tx({ kind: 'transfer', amount: 10000, accountId: 'bank', transferAccountId: 'cash' }),
    ];
    expect(calcAccountBalance('bank', 50000, transactions)).toBe(40000);
    expect(calcAccountBalance('cash', 2000, transactions)).toBe(12000);
    expect(calcAccountBalance('emoney', 500, transactions)).toBe(500);
  });
});

describe('summarizeByCategory(MON-04)', () => {
  it('カテゴリ別に支出を合算し、振替・カテゴリなしは除外する', () => {
    const result = summarizeByCategory(
      [
        tx({ kind: 'expense', amount: 1200, categoryId: 'food' }),
        tx({ kind: 'expense', amount: 800, categoryId: 'food' }),
        tx({ kind: 'expense', amount: 3000, categoryId: 'hobby' }),
        tx({ kind: 'income', amount: 100, categoryId: 'salary' }),
        tx({ kind: 'transfer', amount: 5000, transferAccountId: 'cash' }),
      ],
      'expense',
    );
    expect(result.get('food')).toBe(2000);
    expect(result.get('hobby')).toBe(3000);
    expect(result.has('salary')).toBe(false);
    expect(result.size).toBe(2);
  });
});
