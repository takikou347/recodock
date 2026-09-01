import type { CSSProperties } from 'react';
import { useState } from 'react';

import { formatYearMonth } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { shiftMonth } from '../../lib/calendarGrid';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { TransactionCreateModal } from './TransactionCreateModal';
import type { Transaction, TransactionFilters } from './useMoneySummary';
import {
  buildDonutGradient,
  useMoneyAccounts,
  useMoneyCategories,
  useMoneySummary,
} from './useMoneySummary';

import layout from '../../core/pageLayout.module.css';
import styles from './MoneyHomePage.module.css';

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

  const donutStyle: CSSProperties = {
    '--donut-gradient': buildDonutGradient(categories),
  } as CSSProperties;

  return (
    <div className={[layout.page, moduleThemeClass('money')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.title}>家計簿 ／ {formatYearMonth(month)}</h1>
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
        <div className={layout.actions}>
          <Button
            variant="secondary"
            onClick={() => showToast({ message: 'CSV を書き出しました' })}
          >
            CSV 出力
          </Button>
          <Button variant="primary" icon="plus" onClick={() => setIsCreateOpen(true)}>
            取引を追加
          </Button>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => {
          const toneStyle: CSSProperties = {
            '--tone-fg': `var(--color-${stat.tone}-fg)`,
          } as CSSProperties;
          return (
            <Card key={stat.id} tone={stat.tone}>
              <div style={toneStyle}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statSub}>{stat.sub}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={styles.columns}>
        <div className={styles.sideColumn}>
          <Card>
            <h2 className={styles.cardTitle}>カテゴリ別支出</h2>
            <div className={styles.donutWrap}>
              <div
                className={styles.donut}
                style={donutStyle}
                role="img"
                aria-label="カテゴリ別支出の構成比"
              >
                <div className={styles.donutHole}>
                  <span className={styles.donutLabel}>支出計</span>
                  <span className={styles.donutValue}>{expenseTotal}</span>
                </div>
              </div>
            </div>
            <div className={styles.legend}>
              {categories.map((category) => {
                const rowStyle: CSSProperties = {
                  '--swatch-color': category.colorVar,
                  '--fill-width': `${category.percentage}%`,
                } as CSSProperties;
                return (
                  <div key={category.id} className={styles.legendRow} style={rowStyle}>
                    <span className={styles.legendSwatch} />
                    <span className={styles.legendName}>{category.name}</span>
                    <span className={styles.legendBar}>
                      <span className={styles.legendFill} />
                    </span>
                    <span className={styles.legendAmount}>{category.amount}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className={styles.mainColumn}>
          <Card>
            <div className={styles.trendHead}>
              <h2 className={styles.cardTitle}>月推移(収入／支出)</h2>
              <span className={styles.cardMeta}>直近6か月</span>
            </div>
            <div className={styles.trend}>
              {trend.map((bar) => (
                <div key={bar.label} className={styles.trendMonth}>
                  <div className={styles.trendBars}>
                    <span
                      className={[styles.trendBar, styles.trendIncome].join(' ')}
                      style={{ '--bar-height': `${bar.incomeRatio}%` } as CSSProperties}
                      title={`${bar.label} 収入`}
                    />
                    <span
                      className={[styles.trendBar, styles.trendExpense].join(' ')}
                      style={{ '--bar-height': `${bar.expenseRatio}%` } as CSSProperties}
                      title={`${bar.label} 支出`}
                    />
                  </div>
                  <span className={styles.trendLabel}>{bar.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card isFlush className={styles.txnCard}>
            <div className={styles.txnHead}>
              <h2 className={styles.cardTitle}>取引一覧</h2>
              <Chip
                isSelected={filters.kind === 'all'}
                size="sm"
                onClick={() => setFilters((current) => ({ ...current, kind: 'all' }))}
              >
                すべて
              </Chip>
              <Chip
                tone="money"
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
              <span className={styles.txnCount}>{totalCount.toLocaleString('ja-JP')} 件</span>
            </div>

            <div className={styles.txnBody}>
              {isError ? (
                <div className={styles.states}>
                  <ErrorState
                    title="取引を読み込めませんでした"
                    description="記録は端末に保存済み。接続を確認してください。"
                    onRetry={refetch}
                  />
                </div>
              ) : isLoading ? (
                <div className={styles.states}>
                  <Skeleton lineCount={4} hasBlock />
                </div>
              ) : transactions.length === 0 ? (
                <div className={styles.states}>
                  <EmptyState
                    icon="money"
                    title="まだ取引がありません"
                    description="最初の収支を記録してみましょう"
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        icon="plus"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        取引を追加
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  {transactions.map((transaction) => {
                    const toneStyle: CSSProperties = {
                      '--tone-bg': `var(--color-${transaction.tone}-bg)`,
                      '--tone-fg': `var(--color-${transaction.tone}-fg)`,
                    } as CSSProperties;
                    return (
                      <button
                        key={transaction.id}
                        type="button"
                        className={styles.txnRow}
                        style={toneStyle}
                        onClick={() => setEditTarget(transaction)}
                      >
                        <span className={styles.txnDate}>{transaction.date}</span>
                        <span className={styles.txnCategory}>{transaction.category}</span>
                        <span className={styles.txnMemo}>{transaction.memo}</span>
                        <span className={styles.txnAccount}>{transaction.account}</span>
                        <span
                          className={[
                            styles.txnAmount,
                            transaction.isIncome ? styles.txnAmountIncome : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {transaction.amount}
                        </span>
                      </button>
                    );
                  })}
                  <div className={styles.txnFooter}>
                    <Button variant="text" size="sm">
                      さらに表示
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <TransactionCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <TransactionCreateModal
        isOpen={Boolean(editTarget)}
        transaction={editTarget?.raw}
        onClose={() => setEditTarget(undefined)}
      />
    </div>
  );
}

interface TransactionFilterSelectsProps {
  filters: TransactionFilters;
  onChange: (update: (current: TransactionFilters) => TransactionFilters) => void;
}

/** MON-21 の口座・カテゴリ絞り込み。 */
function TransactionFilterSelects({ filters, onChange }: TransactionFilterSelectsProps) {
  const { accounts } = useMoneyAccounts();
  const { categories } = useMoneyCategories();
  return (
    <span className={styles.filterSelects}>
      <select
        className={styles.filterSelect}
        aria-label="口座で絞り込み"
        value={filters.accountId}
        onChange={(event) => onChange((current) => ({ ...current, accountId: event.target.value }))}
      >
        <option value="all">口座: すべて</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <select
        className={styles.filterSelect}
        aria-label="カテゴリで絞り込み"
        value={filters.categoryId}
        onChange={(event) =>
          onChange((current) => ({ ...current, categoryId: event.target.value }))
        }
      >
        <option value="all">カテゴリ: すべて</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </span>
  );
}
