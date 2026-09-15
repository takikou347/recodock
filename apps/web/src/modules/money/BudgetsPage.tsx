import type { CSSProperties } from 'react';
import { useState } from 'react';

import { AppError, formatAmount, formatYearMonth } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { shiftMonth } from '../../lib/calendarGrid';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { useBudgetStatus, useSaveBudget } from './useBudgets';

import layout from '../../core/pageLayout.module.css';
import styles from './BudgetsPage.module.css';

/**
 * MON-26 予算設定。帳簿全体の月次予算と消化率(MON-06)。
 * カテゴリ別予算はスキーマ上は保存できるが、画面は全体予算を主とする。
 */
export function BudgetsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const { totalBudget, expense, rate, remaining, categoryRows, isLoading, isError, refetch } =
    useBudgetStatus(month);
  const saveBudget = useSaveBudget(user?.id);
  const [amountText, setAmountText] = useState('');
  const [errorText, setErrorText] = useState<string>();

  const onSave = async () => {
    const amount = Number(amountText);
    if (!amountText || !Number.isFinite(amount) || amount < 0) {
      setErrorText('予算は 0 以上の数で入力してください');
      return;
    }
    setErrorText(undefined);
    try {
      await saveBudget.mutateAsync({ month, categoryId: null, amount });
      setAmountText('');
      showToast({ message: '予算を保存しました' });
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <div className={[layout.page, moduleThemeClass('money')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>予算設定 ／ {formatYearMonth(month)}</h1>
        <div className={layout.monthNav}>
          <button
            type="button"
            className={layout.monthNavButton}
            aria-label="前の月"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <button
            type="button"
            className={layout.monthNavButton}
            aria-label="次の月"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="予算を読み込めませんでした"
          description="接続を確認してください。"
          onRetry={refetch}
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : (
        <>
          <Card>
            <div className={styles.statusHead}>
              <p className={styles.statusLabel}>今月の予算</p>
              <p className={styles.statusBudget}>
                {totalBudget > 0 ? formatAmount(totalBudget) : '未設定'}
              </p>
            </div>
            {totalBudget > 0 ? (
              <>
                <div
                  className={styles.meter}
                  role="meter"
                  aria-label="予算消化率"
                  aria-valuenow={rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className={styles.meterFill}
                    style={{ '--meter-width': `${Math.min(rate, 100)}%` } as CSSProperties}
                  />
                </div>
                <p className={styles.statusDetail}>
                  消化率 {rate}% ／ 支出 {formatAmount(expense)} ／ 残り {formatAmount(remaining)}
                </p>
              </>
            ) : (
              <p className={styles.statusDetail}>
                月の予算を設定すると、家計簿ホームに消化率が出ます
              </p>
            )}
          </Card>

          <Card>
            <div className={styles.form}>
              <div className={styles.formField}>
                <TextField
                  label="月の予算(帳簿全体)"
                  type="number"
                  inputMode="numeric"
                  isNumeric
                  value={amountText}
                  placeholder={totalBudget > 0 ? String(totalBudget) : '250000'}
                  errorText={errorText}
                  onChange={(event) => setAmountText(event.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => void onSave()}
                disabled={saveBudget.isPending}
              >
                {saveBudget.isPending ? '保存中…' : '保存する'}
              </Button>
            </div>
          </Card>

          {categoryRows.length > 0 ? (
            <section className={styles.categorySection}>
              <h2 className={layout.sectionLabel}>カテゴリ別の支出(今月)</h2>
              <Card isFlush>
                {categoryRows.map((row) => (
                  <div key={row.categoryId ?? 'uncategorized'} className={styles.categoryRow}>
                    <span className={styles.categoryName}>{row.name}</span>
                    <span className={styles.categoryAmount}>{formatAmount(row.amount)}</span>
                  </div>
                ))}
              </Card>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
