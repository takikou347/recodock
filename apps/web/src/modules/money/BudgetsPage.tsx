import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

import { AppError, formatAmount, formatYearMonth } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { Button as UiButton } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/core/auth';
import { Page, PageHeader } from '@/core/PageLayout';
import { shiftMonth } from '@/lib/calendarGrid';
import { useBudgetStatus, useSaveBudget } from '@/modules/money/useBudgets';

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
    <Page>
      <PageHeader
        title={`予算設定 ／ ${formatYearMonth(month)}`}
        actions={
          <div className="flex items-center gap-1">
            <UiButton
              variant="outline"
              size="icon-sm"
              aria-label="前の月"
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              <ChevronLeftIcon />
            </UiButton>
            <UiButton
              variant="outline"
              size="icon-sm"
              aria-label="次の月"
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              <ChevronRightIcon />
            </UiButton>
          </div>
        }
      />

      {isError ? (
        <ErrorState
          title="予算を読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
          onRetry={refetch}
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : (
        <>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-muted-foreground text-sm font-medium">今月の予算</p>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {totalBudget > 0 ? formatAmount(totalBudget) : '未設定'}
              </p>
            </div>
            {totalBudget > 0 ? (
              <>
                {/* 100% を超えても棒は振り切らせ、超過は下の文言で伝える */}
                <Progress
                  className="mt-3 h-2"
                  value={Math.min(rate, 100)}
                  aria-label="予算消化率"
                />
                <p className="text-muted-foreground mt-2.5 text-sm">
                  消化率 {rate}% ／ 支出 {formatAmount(expense)} ／ 残り {formatAmount(remaining)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-2.5 text-sm">
                月の予算を設定すると、家計簿ホームに消化率が出ます
              </p>
            )}
          </Card>

          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
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
            <section className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-sm font-medium">カテゴリ別の支出(今月)</h2>
              <Card isFlush>
                <ul>
                  {categoryRows.map((row) => (
                    <li
                      key={row.categoryId ?? 'uncategorized'}
                      className="flex min-h-12 items-center gap-3 border-b px-4 py-2 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 truncate">{row.name}</span>
                      <span className="shrink-0 font-mono font-semibold tabular-nums">
                        {formatAmount(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}
        </>
      )}
    </Page>
  );
}
