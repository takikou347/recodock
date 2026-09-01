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

/** 取引を更新する(MON-22 の編集)。 */
export async function updateTransaction(
  client: RecodockClient,
  transactionId: string,
  input: Partial<Omit<CreateTransactionInput, 'ledgerId'>>,
): Promise<void> {
  unwrapVoid(
    await client
      .from('transactions')
      .update({
        ...(input.kind !== undefined && { kind: input.kind }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.occurredOn !== undefined && { occurred_on: input.occurredOn }),
        ...(input.accountId !== undefined && { account_id: input.accountId }),
        ...(input.transferAccountId !== undefined && {
          transfer_account_id: input.transferAccountId,
        }),
        ...(input.categoryId !== undefined && { category_id: input.categoryId }),
        ...(input.memo !== undefined && { memo: input.memo }),
      })
      .eq('id', transactionId),
  );
}

/** 口座を作成する(MON-24)。 */
export async function createAccount(
  client: RecodockClient,
  userId: string,
  ledgerId: string,
  input: { name: string; kind: AccountRecord['kind']; initialBalance: number },
): Promise<void> {
  unwrapVoid(
    await client.from('accounts').insert({
      user_id: userId,
      ledger_id: ledgerId,
      name: input.name,
      kind: input.kind,
      initial_balance: input.initialBalance,
    }),
  );
}

/** 口座を更新する(MON-24。名称・種別・開始残高・アーカイブ)。 */
export async function updateAccount(
  client: RecodockClient,
  accountId: string,
  input: Partial<{
    name: string;
    kind: AccountRecord['kind'];
    initialBalance: number;
    isArchived: boolean;
  }>,
): Promise<void> {
  unwrapVoid(
    await client
      .from('accounts')
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.kind !== undefined && { kind: input.kind }),
        ...(input.initialBalance !== undefined && { initial_balance: input.initialBalance }),
        ...(input.isArchived !== undefined && { is_archived: input.isArchived }),
      })
      .eq('id', accountId),
  );
}

/** カテゴリを作成する(MON-25。ユーザー定義)。 */
export async function createCategory(
  client: RecodockClient,
  userId: string,
  ledgerId: string,
  input: { name: string; kind: CategoryRecord['kind']; sortOrder: number },
): Promise<void> {
  unwrapVoid(
    await client.from('categories').insert({
      user_id: userId,
      ledger_id: ledgerId,
      name: input.name,
      kind: input.kind,
      is_preset: false,
      sort_order: input.sortOrder,
    }),
  );
}

/** カテゴリ名を変更する(MON-25)。 */
export async function renameCategory(
  client: RecodockClient,
  categoryId: string,
  name: string,
): Promise<void> {
  unwrapVoid(await client.from('categories').update({ name }).eq('id', categoryId));
}

/** カテゴリの表示順を保存する(MON-25)。 */
export async function reorderCategories(
  client: RecodockClient,
  categoryIds: readonly string[],
): Promise<void> {
  for (const [index, categoryId] of categoryIds.entries()) {
    unwrapVoid(await client.from('categories').update({ sort_order: index }).eq('id', categoryId));
  }
}

/** カテゴリを削除する(MON-25。取引から参照中は FK 違反 → validation)。 */
export async function removeCategory(client: RecodockClient, categoryId: string): Promise<void> {
  unwrapVoid(await client.from('categories').delete().eq('id', categoryId));
}

/** 予算を保存する(MON-26)。同じ月×カテゴリがあれば上書きする。 */
export async function upsertBudget(
  client: RecodockClient,
  userId: string,
  ledgerId: string,
  input: { month: string; categoryId: string | null; amount: number },
): Promise<void> {
  // UNIQUE(ledger_id, month, category_id) に合わせて既存行を消してから入れ直す
  // (category_id が NULL の行は onConflict で突き合わせられないため)
  let removal = client.from('budgets').delete().eq('ledger_id', ledgerId).eq('month', input.month);
  removal =
    input.categoryId === null
      ? removal.is('category_id', null)
      : removal.eq('category_id', input.categoryId);
  unwrapVoid(await removal);

  unwrapVoid(
    await client.from('budgets').insert({
      user_id: userId,
      ledger_id: ledgerId,
      month: input.month,
      category_id: input.categoryId,
      amount: input.amount,
    }),
  );
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
