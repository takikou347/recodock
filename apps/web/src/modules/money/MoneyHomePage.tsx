import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlusIcon,
  WalletIcon,
} from 'lucide-react';
import { useState } from 'react';

import { formatYearMonth } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { Button as UiButton } from '@/components/ui/button';
import { Page, PageHeader } from '@/core/PageLayout';
import { shiftMonth } from '@/lib/calendarGrid';
import { toMonthKey } from '@/lib/monthRange';
import { cn } from '@/lib/utils';
import { TransactionCreateModal } from '@/modules/money/TransactionCreateModal';
import { buildTransactionsCsv, downloadCsv } from '@/modules/money/transactionsCsv';
import type { Transaction, TransactionFilters } from '@/modules/money/useMoneySummary';
import {
  useMoneyAccounts,
  useMoneyCategories,
  useMoneySummary,
} from '@/modules/money/useMoneySummary';

/**
 * カテゴリの識別は色相ではなく前景色の濃淡で行う(モジュール色の流用をやめた。ADR-0008)。
 * 不透明度で作るため、ライト・ダークどちらでも地に対するコントラストが保たれる。
 */
const CATEGORY_SHADES = [
  'bg-foreground',
  'bg-foreground/75',
  'bg-foreground/55',
  'bg-foreground/40',
  'bg-foreground/28',
  'bg-foreground/18',
] as const;

/**
 * MON-20 家計簿ホーム(月次サマリ) ＋ MON-21 取引一覧。
 * ページがデータ取得を担い、表示コンポーネントは Props で受け取る(コーディング規約 7)。
 */
export function MoneyHomePage() {
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filters, setFilters] = useState<TransactionFilters>({
    kind: 'all',
    accountId: 'all',
    categoryId: 'all',
  });
  const [editTarget, setEditTarget] = useState<Transaction>();
  const {
    stats,
    categories,
    trend,
    transactions,
    totalCount,
    expenseTotal,
    isLoading,
    isError,
    refetch,
  } = useMoneySummary(month, filters);

  // 全月ゼロのときに高さ 0 の棒だけが残らないよう、描くものがあるかを先に見る
  const hasTrend = trend.some((bar) => bar.incomeRatio > 0 || bar.expenseRatio > 0);
  const isFiltered =
    filters.kind !== 'all' || filters.accountId !== 'all' || filters.categoryId !== 'all';

  const onExportCsv = () => {
    downloadCsv(`家計簿_${toMonthKey(month)}.csv`, buildTransactionsCsv(transactions));
    showToast({ message: `CSV を書き出しました(${transactions.length} 件)` });
  };

  return (
    <Page>
      <PageHeader
        title={`家計簿 ／ ${formatYearMonth(month)}`}
        actions={
          <>
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
            <Button
              variant="secondary"
              icon={DownloadIcon}
              disabled={transactions.length === 0}
              onClick={onExportCsv}
            >
              CSV 出力
            </Button>
            <Button variant="primary" icon={PlusIcon} onClick={() => setIsCreateOpen(true)}>
              取引を追加
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="text-muted-foreground mt-1 truncate text-sm">{stat.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-base font-semibold">カテゴリ別支出</h2>
            {/* 単位は見出しに一度だけ置き、行は数字だけを等幅で並べて桁を比べやすくする */}
            <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
              支出計 {expenseTotal} 円
            </span>
          </div>
          {categories.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">この月の支出はまだありません</p>
          ) : (
            <>
              <div
                className="bg-muted mt-4 flex h-2.5 overflow-hidden rounded-full"
                role="img"
                aria-label="カテゴリ別支出の構成比"
              >
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className={cn('h-full', CATEGORY_SHADES[index % CATEGORY_SHADES.length])}
                    style={{ width: `${category.percentage}%` }}
                  />
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {categories.map((category, index) => (
                  <li key={category.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-xs',
                        CATEGORY_SHADES[index % CATEGORY_SHADES.length],
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                      {category.percentage}%
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                      {category.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">月推移(収入／支出)</h2>
              <span className="text-muted-foreground shrink-0 text-xs">直近6か月</span>
            </div>
            {hasTrend ? (
              <>
                <div
                  className="mt-4 flex h-36 items-end gap-2 border-b pb-1.5"
                  role="img"
                  aria-label="直近6か月の収入と支出の推移"
                >
                  {trend.map((bar) => (
                    <div
                      key={bar.label}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        {bar.incomeRatio > 0 ? (
                          <div
                            className="min-h-0.5 w-3 rounded-t-sm bg-emerald-600 sm:w-4 dark:bg-emerald-500"
                            style={{ height: `${bar.incomeRatio}%` }}
                          />
                        ) : null}
                        {bar.expenseRatio > 0 ? (
                          <div
                            className="bg-foreground/70 min-h-0.5 w-3 rounded-t-sm sm:w-4"
                            style={{ height: `${bar.expenseRatio}%` }}
                          />
                        ) : null}
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500"
                      aria-hidden="true"
                    />
                    収入
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-foreground/70 size-2.5 rounded-xs" aria-hidden="true" />
                    支出
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                直近6か月に記録された収支がありません
              </p>
            )}
          </Card>

          <Card isFlush>
            <div className="flex flex-wrap items-center gap-2 border-b p-3 sm:px-4">
              <h2 className="font-heading mr-1 text-base font-semibold">取引一覧</h2>
              <Chip
                isSelected={filters.kind === 'all'}
                size="sm"
                onClick={() => setFilters((current) => ({ ...current, kind: 'all' }))}
              >
                すべて
              </Chip>
              <Chip
                size="sm"
                isSelected={filters.kind === 'expense'}
                onClick={() => setFilters((current) => ({ ...current, kind: 'expense' }))}
              >
                支出
              </Chip>
              <Chip
                size="sm"
                isSelected={filters.kind === 'transfer'}
                onClick={() => setFilters((current) => ({ ...current, kind: 'transfer' }))}
              >
                振替
              </Chip>
              <TransactionFilterSelects filters={filters} onChange={setFilters} />
              <span className="text-muted-foreground ml-auto text-sm tabular-nums">
                {isFiltered
                  ? `${transactions.length.toLocaleString('ja-JP')} / ${totalCount.toLocaleString('ja-JP')} 件`
                  : `${totalCount.toLocaleString('ja-JP')} 件`}
              </span>
            </div>

            {isError ? (
              <div className="p-4">
                <ErrorState
                  title="取引を読み込めませんでした"
                  description="通信を確認してもう一度お試しください。"
                  onRetry={refetch}
                />
              </div>
            ) : isLoading ? (
              <div className="p-4">
                <Skeleton lineCount={4} hasBlock />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-4">
                {totalCount === 0 ? (
                  <EmptyState
                    icon={WalletIcon}
                    title="まだ取引がありません"
                    description="最初の収支を記録してみましょう"
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlusIcon}
                        onClick={() => setIsCreateOpen(true)}
                      >
                        取引を追加
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={WalletIcon}
                    title="条件に合う取引がありません"
                    description="絞り込みを変えるか、解除してください"
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setFilters({ kind: 'all', accountId: 'all', categoryId: 'all' })
                        }
                      >
                        絞り込みを解除
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <ul>
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      className="hover:bg-muted/50 focus-visible:ring-ring/50 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none sm:grid-cols-[3rem_auto_minmax(0,1fr)_8rem_7rem] sm:px-4"
                      onClick={() => setEditTarget(transaction)}
                    >
                      <span className="text-muted-foreground hidden font-mono text-xs tabular-nums sm:inline">
                        {transaction.date}
                      </span>
                      <span className="bg-muted text-muted-foreground max-w-28 truncate rounded-md px-2 py-0.5 text-xs">
                        {transaction.category}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {transaction.memo || '—'}
                      </span>
                      <span className="text-muted-foreground hidden truncate text-xs sm:inline">
                        {transaction.account}
                      </span>
                      <span
                        className={cn(
                          'text-right font-mono text-sm font-semibold tabular-nums',
                          // 金額の符号は情報なので、収入にだけ色を足す(それ以外は色を持たない)
                          transaction.isIncome && 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {transaction.amount}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <TransactionCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <TransactionCreateModal
        isOpen={Boolean(editTarget)}
        transaction={editTarget?.raw}
        onClose={() => setEditTarget(undefined)}
      />
    </Page>
  );
}

interface TransactionFilterSelectsProps {
  filters: TransactionFilters;
  onChange: (update: (current: TransactionFilters) => TransactionFilters) => void;
}

/** MON-21 の口座・カテゴリ絞り込み。アプリ内で唯一のネイティブ select だった(監査 H-18)。 */
function TransactionFilterSelects({ filters, onChange }: TransactionFilterSelectsProps) {
  const { accounts } = useMoneyAccounts();
  const { categories } = useMoneyCategories();
  return (
    <>
      <Select
        ariaLabel="口座で絞り込み"
        className="h-7"
        value={filters.accountId}
        options={[
          { value: 'all', label: '口座: すべて' },
          ...accounts.map((account) => ({ value: account.id, label: account.name })),
        ]}
        onChange={(accountId) => onChange((current) => ({ ...current, accountId }))}
      />
      <Select
        ariaLabel="カテゴリで絞り込み"
        className="h-7"
        value={filters.categoryId}
        options={[
          { value: 'all', label: 'カテゴリ: すべて' },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ]}
        onChange={(categoryId) => onChange((current) => ({ ...current, categoryId }))}
      />
    </>
  );
}
