import { useMemo } from 'react';

/** MON-20 の集計カード。 */
export interface MoneyStat {
  id: string;
  label: string;
  value: string;
  sub: string;
  /** 面の色に使うモジュールキー相当のトーン */
  tone: 'money' | 'diary' | 'calendar' | 'notes';
}

/** カテゴリ別支出(ドーナツと内訳)。 */
export interface CategoryBreakdown {
  id: string;
  name: string;
  /** 円グラフ・バーの色(CSS 変数名) */
  colorVar: string;
  /** 構成比 0〜100 */
  percentage: number;
  amount: string;
}

/** 月推移の 1 本(収入／支出)。高さは 0〜100 の割合。 */
export interface TrendBar {
  label: string;
  incomeRatio: number;
  expenseRatio: number;
}

/** MON-21 取引一覧の 1 行。 */
export interface Transaction {
  id: string;
  /** リスト内表記: 08/22 */
  date: string;
  category: string;
  /** カテゴリバッジのトーン */
  tone: 'money' | 'notes' | 'calendar' | 'items' | 'map' | 'diary';
  memo: string;
  account: string;
  amount: string;
  /** 収入は緑＋で表示する */
  isIncome: boolean;
}

export type TransactionFilter = 'all' | 'expense' | 'transfer';

export interface MoneySummaryResult {
  stats: readonly MoneyStat[];
  categories: readonly CategoryBreakdown[];
  trend: readonly TrendBar[];
  transactions: readonly Transaction[];
  /** 全期間の取引件数 */
  totalCount: number;
  /** ドーナツ中央に出す支出計 */
  expenseTotal: string;
  isLoading: boolean;
  isError: boolean;
}

// TODO: transactions / budgets を引くリポジトリ関数＋TanStack Query に差し替える。
// 集計は PostgREST の集計クエリまたはビューで行う(NFR-P2)。
// 現在はデザイン(MON-20 / MON-21)のサンプルを表示する。
const SAMPLE_TRANSACTIONS: readonly Transaction[] = [
  {
    id: 'tx1',
    date: '08/22',
    category: '食費',
    tone: 'money',
    memo: 'スーパーで買い物',
    account: '三井住友カード',
    amount: '-¥1,280',
    isIncome: false,
  },
  {
    id: 'tx2',
    date: '08/22',
    category: '趣味',
    tone: 'notes',
    memo: '文庫本 2冊',
    account: '現金',
    amount: '-¥1,540',
    isIncome: false,
  },
  {
    id: 'tx3',
    date: '08/21',
    category: '交通',
    tone: 'calendar',
    memo: '地下鉄 往復',
    account: 'ICカード',
    amount: '-¥560',
    isIncome: false,
  },
  {
    id: 'tx4',
    date: '08/21',
    category: '食費',
    tone: 'money',
    memo: 'アイスコーヒー',
    account: '現金',
    amount: '-¥480',
    isIncome: false,
  },
  {
    id: 'tx5',
    date: '08/20',
    category: '日用品',
    tone: 'items',
    memo: 'リネンシャツ',
    account: '楽天カード',
    amount: '-¥6,800',
    isIncome: false,
  },
  {
    id: 'tx6',
    date: '08/20',
    category: '振替',
    tone: 'map',
    memo: '銀行 → 現金',
    account: '三菱UFJ',
    amount: '¥30,000',
    isIncome: false,
  },
  {
    id: 'tx7',
    date: '08/19',
    category: '給与',
    tone: 'money',
    memo: '8月分 給与',
    account: '三菱UFJ',
    amount: '+¥280,000',
    isIncome: true,
  },
  {
    id: 'tx8',
    date: '08/18',
    category: '住居',
    tone: 'calendar',
    memo: '家賃',
    account: '三菱UFJ',
    amount: '-¥88,000',
    isIncome: false,
  },
];

const SAMPLE_CATEGORIES: readonly CategoryBreakdown[] = [
  { id: 'c1', name: '食費', colorVar: 'var(--color-diary-line)', percentage: 32, amount: '58,400' },
  {
    id: 'c2',
    name: '住居',
    colorVar: 'var(--color-calendar-line)',
    percentage: 24,
    amount: '44,000',
  },
  { id: 'c3', name: '交通', colorVar: 'var(--color-money-line)', percentage: 18, amount: '32,800' },
  { id: 'c4', name: '趣味', colorVar: 'var(--color-notes-line)', percentage: 14, amount: '25,600' },
  {
    id: 'c5',
    name: 'その他',
    colorVar: 'var(--color-items-line)',
    percentage: 12,
    amount: '21,600',
  },
];

/** サンプルデータが対象とする月(2026年8月) */
const SAMPLE_YEAR = 2026;
const SAMPLE_MONTH_INDEX = 7;

/** 月次サマリと取引一覧を返す(MON-20 / MON-21)。 */
export function useMoneySummary(month: Date, filter: TransactionFilter): MoneySummaryResult {
  return useMemo(() => {
    // サンプルを持つのは 2026年8月 のみ。他の月は 0 件(空状態)になる。
    const isSampleMonth =
      month.getFullYear() === SAMPLE_YEAR && month.getMonth() === SAMPLE_MONTH_INDEX;
    const monthTransactions = isSampleMonth ? SAMPLE_TRANSACTIONS : [];

    const transactions =
      filter === 'all'
        ? monthTransactions
        : filter === 'transfer'
          ? monthTransactions.filter((transaction) => transaction.category === '振替')
          : monthTransactions.filter(
              (transaction) => !transaction.isIncome && transaction.category !== '振替',
            );

    return {
      stats: [
        { id: 's1', label: '収入', value: '¥280,000', sub: '前月比 ±0', tone: 'money' },
        { id: 's2', label: '支出', value: '¥182,400', sub: '前月比 +¥8,200', tone: 'diary' },
        { id: 's3', label: '収支', value: '+¥97,600', sub: '貯蓄率 34.8%', tone: 'calendar' },
        { id: 's4', label: '予算消化率', value: '73%', sub: '残り ¥67,600 / 9日', tone: 'notes' },
      ],
      categories: isSampleMonth ? SAMPLE_CATEGORIES : [],
      trend: [
        { label: '3月', incomeRatio: 58, expenseRatio: 44 },
        { label: '4月', incomeRatio: 62, expenseRatio: 52 },
        { label: '5月', incomeRatio: 60, expenseRatio: 68 },
        { label: '6月', incomeRatio: 64, expenseRatio: 49 },
        { label: '7月', incomeRatio: 61, expenseRatio: 58 },
        { label: '8月', incomeRatio: 72, expenseRatio: 47 },
      ],
      transactions,
      totalCount: isSampleMonth ? 1284 : 0,
      expenseTotal: '182,400',
      isLoading: false,
      isError: false,
    };
  }, [month, filter]);
}

/** カテゴリ構成比から conic-gradient の指定を組み立てる(ドーナツ)。 */
export function buildDonutGradient(categories: readonly CategoryBreakdown[]): string {
  let cursor = 0;
  const stops = categories.map((category) => {
    const start = cursor;
    cursor += category.percentage;
    return `${category.colorVar} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}
