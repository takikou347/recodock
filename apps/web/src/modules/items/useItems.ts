import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateItemInput, ItemRecord } from '@recodock/shared';
import { formatDateValue, itemsRepo, queryKeys } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

/** ITM-50 の 1 件。 */
export interface Item {
  id: string;
  name: string;
  category: string;
  badge: string;
  /** 保証期限が近いなど注意を促すバッジか */
  isWarning: boolean;
}

/** 保証期限がこの日数以内なら注意表示にする(ITM-52)。 */
const WARRANTY_WARNING_DAYS = 30;

export interface ItemsResult {
  items: readonly Item[];
  totalCount: number;
  categories: readonly { id: string; label: string; count: number }[];
  isLoading: boolean;
  isError: boolean;
}

function daysUntil(dateText: string, today: Date): number {
  const target = new Date(`${dateText}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function toBadge(record: ItemRecord, today: Date): { badge: string; isWarning: boolean } {
  if (record.warrantyExpiresOn) {
    const remaining = daysUntil(record.warrantyExpiresOn, today);
    if (remaining >= 0 && remaining <= WARRANTY_WARNING_DAYS) {
      return { badge: `保証あと${remaining}日`, isWarning: true };
    }
    const expires = new Date(`${record.warrantyExpiresOn}T00:00:00`);
    return { badge: `保証 ${formatDateValue(expires).slice(0, 7)}まで`, isWarning: false };
  }
  if (record.purchasedOn) {
    const purchased = new Date(`${record.purchasedOn}T00:00:00`);
    return { badge: `${formatDateValue(purchased).slice(5)} 追加`, isWarning: false };
  }
  return { badge: '登録済み', isWarning: false };
}

/** 持ち物一覧を返す(ITM-50)。category が 'all' 以外ならその分類で絞り込む。 */
export function useItems(category: string): ItemsResult {
  const query = useQuery({
    queryKey: queryKeys.items.list('all'),
    queryFn: () => itemsRepo.list(supabase),
  });

  const today = new Date();
  const records = query.data ?? [];

  const decorated = records.map((record) => {
    const { badge, isWarning } = toBadge(record, today);
    return {
      id: record.id,
      name: record.name,
      category: record.category ?? '未分類',
      badge,
      isWarning,
    };
  });

  const items =
    category === 'all'
      ? decorated
      : category === 'warning'
        ? decorated.filter((item) => item.isWarning)
        : decorated.filter((item) => item.category === category);

  // 分類チップは実データから組み立てる
  const countByCategory = new Map<string, number>();
  for (const item of decorated) {
    countByCategory.set(item.category, (countByCategory.get(item.category) ?? 0) + 1);
  }
  const warningCount = decorated.filter((item) => item.isWarning).length;

  const categories = [
    ...[...countByCategory].map(([label, count]) => ({ id: label, label, count })),
    ...(warningCount > 0 ? [{ id: 'warning', label: '保証期限間近', count: warningCount }] : []),
  ];

  return {
    items,
    totalCount: decorated.length,
    categories,
    isLoading: query.isPending,
    isError: query.isError,
  };
}

/** 持ち物を追加する(ITM-51)。 */
export function useCreateItem(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ItemRecord, Error, CreateItemInput>({
    mutationFn: (input) => {
      if (!userId) throw new Error('ログインが必要です');
      return itemsRepo.create(supabase, userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}
