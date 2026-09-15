import { PlusIcon, WalletIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

import { AppError, formatAmount } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { moduleThemeClass } from '../../lib/moduleTheme';
import type { AccountFormValue, AccountWithBalance } from './useAccounts';
import { useAccountsWithBalance, useSaveAccount } from './useAccounts';

import layout from '../../core/pageLayout.module.css';
import styles from './AccountsPage.module.css';

const KIND_OPTIONS = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit_card', label: 'クレジットカード' },
  { value: 'emoney', label: '電子マネー' },
] as const;

const KIND_LABELS: Readonly<Record<AccountWithBalance['kind'], string>> = {
  cash: '現金',
  bank: '銀行',
  credit_card: 'クレジットカード',
  emoney: '電子マネー',
};

/**
 * MON-23 口座一覧・残高。現在残高は「開始残高 + 取引の積み上げ」で導出する(MON-02)。
 * MON-24 口座作成・編集はモーダルで行う。
 */
export function AccountsPage() {
  const { accounts, totalBalance, isLoading, isError, refetch } = useAccountsWithBalance();
  const [editing, setEditing] = useState<AccountWithBalance | 'new'>();

  return (
    <div className={[layout.page, moduleThemeClass('money')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>口座・残高</h1>
        <span className={layout.count}>{accounts.length}件</span>
        <div className={layout.actions}>
          <Button variant="primary" icon={PlusIcon} onClick={() => setEditing('new')}>
            口座を追加
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="口座を読み込めませんでした"
          description="接続を確認してください。"
          onRetry={refetch}
        />
      ) : isLoading ? (
        <Skeleton lineCount={3} hasBlock />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="まだ口座がありません"
          description="現金・銀行・クレカ・電子マネーを登録して残高を管理できます"
          action={
            <Button variant="primary" size="sm" icon={PlusIcon} onClick={() => setEditing('new')}>
              口座を追加
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <p className={styles.totalLabel}>総残高</p>
            <p className={styles.totalValue}>{formatAmount(totalBalance)}</p>
          </Card>

          <div className={styles.list}>
            {accounts.map((account) => (
              <Card key={account.id} isRow onClick={() => setEditing(account)}>
                <span className={styles.row}>
                  <span className={styles.rowBody}>
                    <span className={styles.rowName}>{account.name}</span>
                    <span className={styles.rowKind}>{KIND_LABELS[account.kind]}</span>
                  </span>
                  <span
                    className={styles.rowBalance}
                    style={
                      {
                        '--balance-color':
                          account.balance < 0 ? 'var(--color-danger-active)' : 'var(--color-ink)',
                      } as CSSProperties
                    }
                  >
                    {formatAmount(account.balance)}
                  </span>
                </span>
              </Card>
            ))}
          </div>
        </>
      )}

      <AccountEditModal
        isOpen={editing !== undefined}
        account={editing === 'new' ? undefined : editing}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}

interface AccountEditModalProps {
  isOpen: boolean;
  account: AccountWithBalance | undefined;
  onClose: () => void;
}

/** MON-24 口座作成・編集。名称・種別・開始残高。 */
function AccountEditModal({ isOpen, account, onClose }: AccountEditModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const saveAccount = useSaveAccount(user?.id);
  const [name, setName] = useState(account?.name ?? '');
  const [kind, setKind] = useState<AccountFormValue['kind']>(account?.kind ?? 'bank');
  const [initialBalance, setInitialBalance] = useState(String(account?.initialBalance ?? 0));
  const [errorText, setErrorText] = useState<string>();
  const [loadedId, setLoadedId] = useState<string>();

  // 開き直したときに編集対象をフォームへ読み込む
  if (isOpen && (account?.id ?? 'new') !== loadedId) {
    setLoadedId(account?.id ?? 'new');
    setName(account?.name ?? '');
    setKind(account?.kind ?? 'bank');
    setInitialBalance(String(account?.initialBalance ?? 0));
    setErrorText(undefined);
  }

  const onSave = async () => {
    const parsedBalance = Number(initialBalance);
    if (!name.trim()) {
      setErrorText('口座名を入力してください');
      return;
    }
    if (!Number.isFinite(parsedBalance)) {
      setErrorText('開始残高は数値で入力してください');
      return;
    }
    try {
      await saveAccount.mutateAsync({
        accountId: account?.id,
        name: name.trim(),
        kind,
        initialBalance: parsedBalance,
      });
      showToast({ message: '口座を保存しました' });
      onClose();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? '口座を編集' : '口座を追加'}
      icon={WalletIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void onSave()} disabled={saveAccount.isPending}>
            {saveAccount.isPending ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label="口座名"
        value={name}
        placeholder="三菱UFJ"
        errorText={errorText}
        onChange={(event) => setName(event.target.value)}
      />
      <div>
        <span className={styles.fieldLabel}>種別</span>
        <Select options={KIND_OPTIONS} value={kind} onChange={setKind} ariaLabel="口座の種別" />
      </div>
      <TextField
        label="開始残高"
        type="number"
        inputMode="numeric"
        isNumeric
        value={initialBalance}
        onChange={(event) => setInitialBalance(event.target.value)}
      />
    </Modal>
  );
}
