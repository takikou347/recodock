import { useMemo } from 'react';

/** ITM-50 の 1 件。 */
export interface Item {
  id: string;
  name: string;
  category: string;
  /** 保証期限などの状態バッジ */
  badge: string;
  /** 期限が近いなど注意を促すバッジか */
  isWarning: boolean;
}

export interface ItemsResult {
  items: readonly Item[];
  /** 全件数(フィルタ前) */
  totalCount: number;
  categories: readonly { id: string; label: string; count: number }[];
  isLoading: boolean;
  isError: boolean;
}

// TODO: items テーブルを引くリポジトリ関数＋TanStack Query に差し替える。
const SAMPLE_ITEMS: readonly Item[] = [
  { id: 'i1', name: '加湿器', category: '家電', badge: '保証 2027/01まで', isWarning: false },
  { id: 'i2', name: '炊飯器', category: '家電', badge: '保証あと28日', isWarning: true },
  { id: 'i3', name: 'リネンシャツ', category: '衣類', badge: '08/20 追加', isWarning: false },
  { id: 'i4', name: 'パスポート', category: '書類', badge: '期限 2028/04', isWarning: false },
  { id: 'i5', name: 'キャンプチェア', category: 'アウトドア', badge: '貸出中', isWarning: false },
  { id: 'i6', name: 'ドライヤー', category: '家電', badge: '保証 2026/12まで', isWarning: false },
];

/** 持ち物一覧を返す(ITM-50)。category が 'all' 以外ならその分類で絞り込む。 */
export function useItems(category: string): ItemsResult {
  return useMemo(() => {
    const items =
      category === 'all'
        ? SAMPLE_ITEMS
        : category === 'warning'
          ? SAMPLE_ITEMS.filter((item) => item.isWarning)
          : SAMPLE_ITEMS.filter((item) => item.category === category);

    return {
      items,
      totalCount: 48,
      categories: [
        { id: '家電', label: '家電', count: 12 },
        { id: '衣類', label: '衣類', count: 8 },
        { id: '書類', label: '書類', count: 5 },
        { id: 'warning', label: '保証期限間近', count: 1 },
      ],
      isLoading: false,
      isError: false,
    };
  }, [category]);
}
