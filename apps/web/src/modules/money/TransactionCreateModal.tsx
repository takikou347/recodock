import { WalletIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AppError, type TransactionRecord } from '@recodock/shared';

import { Button } from '@/components/Button';
import { DatePicker } from '@/components/DatePicker';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Select } from '@/components/Select';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/core/auth';
import { toDateKey } from '@/lib/monthRange';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useMoneyAccounts,
  useMoneyCategories,
  useUpdateTransaction,
} from '@/modules/money/useMoneySummary';

type TransactionKindValue = 'expense' | 'income' | 'transfer';

const KIND_OPTIONS = [
  { value: 'income', label: '収入' },
  { value: 'expense', label: '支出' },
  { value: 'transfer', label: '振替' },
] as const satisfies readonly { value: TransactionKindValue; label: string }[];

export interface TransactionCreateModalProps {
  isOpen: boolean;
  /** 渡すと編集モード(MON-22 は作成・編集を兼ねる) */
  transaction?: TransactionRecord;
  onClose: () => void;
}

/**
 * 取引の追加・編集(MON-22 の PC 版)。
 * 種別で入力項目が変わる: 振替は入金先を選び、カテゴリを持たない(DB の CHECK 制約に対応)。
 */
export function TransactionCreateModal({
  isOpen,
  transaction,
  onClose,
}: TransactionCreateModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { accounts } = useMoneyAccounts();
  const { categories } = useMoneyCategories();
  const createTransaction = useCreateTransaction(user?.id);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const loadedId = useRef<string | undefined>(undefined);

  const [kind, setKind] = useState<TransactionKindValue>('expense');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [occurredOn, setOccurredOn] = useState(() => new Date());
  const [accountId, setAccountId] = useState('');
  const [transferAccountId, setTransferAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errorText, setErrorText] = useState<string>();

  // 編集対象が来たらフォームへ読み込む(開き直すたびに一度だけ)
  useEffect(() => {
    if (!isOpen) {
      loadedId.current = undefined;
      return;
    }
    if (!transaction || loadedId.current === transaction.id) return;
    loadedId.current = transaction.id;
    setKind(transaction.kind);
    setAmount(String(transaction.amount));
    setMemo(transaction.memo ?? '');
    setOccurredOn(new Date(`${transaction.occurredOn}T00:00:00`));
    setAccountId(transaction.accountId);
    setTransferAccountId(transaction.transferAccountId ?? '');
    setCategoryId(transaction.categoryId ?? '');
  }, [isOpen, transaction]);

  const accountOptions = accounts.map((account) => ({ value: account.id, label: account.name }));
  const categoryOptions = categories
    .filter((category) =>
      kind === 'income' ? category.kind === 'income' : category.kind === 'expense',
    )
    .map((category) => ({ value: category.id, label: category.name }));

  const selectedAccount = accountId || accountOptions[0]?.value || '';
  const selectedTransferAccount =
    transferAccountId ||
    accountOptions.find((option) => option.value !== selectedAccount)?.value ||
    '';
  const selectedCategory = categoryId || categoryOptions[0]?.value || '';

  const onSave = async () => {
    const parsed = Number(amount);
    if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
      setErrorText('金額は 0 より大きい数で入力してください');
      return;
    }
    if (!selectedAccount) {
      setErrorText('先に口座を登録してください');
      return;
    }
    if (kind === 'transfer' && !selectedTransferAccount) {
      setErrorText('振替先の口座を選んでください');
      return;
    }
    setErrorText(undefined);

    const input = {
      kind,
      amount: parsed,
      occurredOn: toDateKey(occurredOn),
      accountId: selectedAccount,
      transferAccountId: kind === 'transfer' ? selectedTransferAccount : null,
      categoryId: kind === 'transfer' ? null : selectedCategory || null,
      memo: memo.trim() || null,
    };
    try {
      if (transaction) {
        await updateTransaction.mutateAsync({ transactionId: transaction.id, input });
      } else {
        await createTransaction.mutateAsync(input);
      }
      showToast({ message: '取引を保存しました' });
      setAmount('');
      setMemo('');
      onClose();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  const onDelete = async () => {
    if (!transaction) return;
    await deleteTransaction.mutateAsync(transaction.id);
    showToast({ message: '取引を削除しました' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? '取引を編集' : '取引を追加'}
      icon={WalletIcon}
      footer={
        <>
          {transaction ? (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => void onDelete()}
              disabled={deleteTransaction.isPending}
            >
              削除
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSave()}
            disabled={createTransaction.isPending}
          >
            {createTransaction.isPending ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <SegmentedControl
        options={KIND_OPTIONS}
        value={kind}
        onChange={setKind}
        ariaLabel="取引の種別"
      />

      <TextField
        label="金額"
        type="number"
        inputMode="decimal"
        min={1}
        value={amount}
        placeholder="1280"
        isNumeric
        errorText={errorText}
        onChange={(event) => setAmount(event.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <span className="text-sm font-medium">日付</span>
          <DatePicker value={occurredOn} onChange={setOccurredOn} ariaLabel="取引の日付" />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium">{kind === 'transfer' ? '出金元' : '口座'}</span>
          {accountOptions.length > 0 ? (
            <Select
              options={accountOptions}
              value={selectedAccount}
              onChange={setAccountId}
              ariaLabel="口座"
              className="w-full"
            />
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-sm">
              口座が未登録です
            </p>
          )}
        </div>
      </div>

      {kind === 'transfer' ? (
        <div className="grid gap-2">
          <span className="text-sm font-medium">入金先</span>
          <Select
            options={accountOptions.filter((option) => option.value !== selectedAccount)}
            value={selectedTransferAccount}
            onChange={setTransferAccountId}
            ariaLabel="振替先の口座"
            className="w-full"
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <span className="text-sm font-medium">カテゴリ</span>
          {categoryOptions.length > 0 ? (
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={setCategoryId}
              ariaLabel="カテゴリ"
              className="w-full"
            />
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-sm">
              カテゴリが未登録です
            </p>
          )}
        </div>
      )}

      <TextField
        label="メモ"
        value={memo}
        placeholder="スーパーで買い物"
        onChange={(event) => setMemo(event.target.value)}
      />
    </Modal>
  );
}
