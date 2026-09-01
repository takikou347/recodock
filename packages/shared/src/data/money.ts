// 家計簿(MON)のリポジトリ関数。金額計算そのものは domain/money.ts が持つ。
import type { TransactionKind } from '../domain/money';
import type { RecodockClient } from '../supabase/client';
import { toAppError, unwrap, unwrapVoid } from './errors';

export interface LedgerRecord {
  id: string;
  name: string;
}

export interface AccountRecord {
  id: string;
  name: string;
  kind: 'cash' | 'bank' | 'credit_card' | 'emoney';
  initialBalance: number;
  isArchived: boolean;
}

export interface CategoryRecord {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  sortOrder: number;
}

export interface TransactionRecord {
  id: string;
  kind: TransactionKind;
  /** 常に正の値。符号は kind で解釈する */
  amount: number;
  /** YYYY-MM-DD */
  occurredOn: string;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  memo: string | null;
}

export interface CreateTransactionInput {
  ledgerId: string;
  kind: TransactionKind;
  amount: number;
  occurredOn: string;
  accountId: string;
  transferAccountId?: string | null;
  categoryId?: string | null;
  memo?: string | null;
}

export interface BudgetRecord {
  id: string;
  /** YYYY-MM-01 */
  month: string;
  categoryId: string | null;
  amount: number;
}

const TRANSACTION_COLUMNS =
  'id, kind, amount, occurred_on, account_id, transfer_account_id, category_id, memo';

/** 既定の家計簿(ledger)を取得する。無ければ作成する(MON-01)。 */
export async function getOrCreateLedger(
  client: RecodockClient,
  userId: string,
): Promise<LedgerRecord> {
  // 0件は「未作成」という正常系なので unwrap(0件を not_found にする)は使わない
  const existing = await client.from('ledgers').select('id, name').limit(1);
  if (existing.error) throw toAppError(existing.error);
  const found = existing.data?.[0];
  if (found) return { id: found.id, name: found.name };

  const created = await client
    .from('ledgers')
    .insert({ user_id: userId, name: '家計簿' })
    .select('id, name')
    .single();
  const row = unwrap(created);
  return { id: row.id, name: row.name };
}

/** 口座一覧(MON-02)。 */
export async function listAccounts(client: RecodockClient): Promise<AccountRecord[]> {
  const result = await client
    .from('accounts')
    .select('id, name, kind, initial_balance, is_archived')
    .order('sort_order');
  return unwrap(result).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind as AccountRecord['kind'],
    initialBalance: Number(row.initial_balance),
    isArchived: row.is_archived,
  }));
}

/** カテゴリ一覧(MON-03)。 */
export async function listCategories(client: RecodockClient): Promise<CategoryRecord[]> {
  const result = await client
    .from('categories')
    .select('id, name, kind, sort_order')
    .order('sort_order');
  return unwrap(result).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind as CategoryRecord['kind'],
    sortOrder: row.sort_order,
  }));
}

/** 指定月の取引一覧(MON-21)。fromDate/toDate は YYYY-MM-DD。 */
export async function listTransactions(
  client: RecodockClient,
  fromDate: string,
  toDate: string,
): Promise<TransactionRecord[]> {
  const result = await client
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .gte('occurred_on', fromDate)
    .lte('occurred_on', toDate)
    .order('occurred_on', { ascending: false });
  return unwrap(result).map((row) => ({
    id: row.id,
    kind: row.kind as TransactionKind,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    accountId: row.account_id,
    transferAccountId: row.transfer_account_id,
    categoryId: row.category_id,
    memo: row.memo,
  }));
}

/** 取引を作成する(MON-22)。 */
export async function createTransaction(
  client: RecodockClient,
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionRecord> {
  const result = await client
    .from('transactions')
    .insert({
      user_id: userId,
      ledger_id: input.ledgerId,
      kind: input.kind,
      amount: input.amount,
      occurred_on: input.occurredOn,
      account_id: input.accountId,
      // 振替はカテゴリを持てない(DB の CHECK 制約)
      transfer_account_id: input.kind === 'transfer' ? (input.transferAccountId ?? null) : null,
      category_id: input.kind === 'transfer' ? null : (input.categoryId ?? null),
      memo: input.memo ?? null,
    })
    .select(TRANSACTION_COLUMNS)
    .single();
  const row = unwrap(result);
  return {
    id: row.id,
    kind: row.kind as TransactionKind,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    accountId: row.account_id,
    transferAccountId: row.transfer_account_id,
    categoryId: row.category_id,
    memo: row.memo,
  };
}

/** 取引を削除する。 */
export async function removeTransaction(
  client: RecodockClient,
  transactionId: string,
): Promise<void> {
  unwrapVoid(await client.from('transactions').delete().eq('id', transactionId));
}

/** 指定月の予算(MON-06)。month は YYYY-MM-01。 */
export async function listBudgets(client: RecodockClient, month: string): Promise<BudgetRecord[]> {
  const result = await client
    .from('budgets')
    .select('id, month, category_id, amount')
    .eq('month', month);
  return unwrap(result).map((row) => ({
    id: row.id,
    month: row.month,
    categoryId: row.category_id,
    amount: Number(row.amount),
  }));
}
