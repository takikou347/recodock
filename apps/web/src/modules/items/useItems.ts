import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateItemInput, ItemRecord } from '@recodock/shared';
import { formatDateValue, itemsRepo, queryKeys } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

/** ITM-50 の 1 件。raw は ITM-51 詳細 / ITM-52 編集への受け渡しに使う。 */
export interface Item {
  id: string;
  name: string;
  category: string;
  badge: string;
  /** 保証期限が近いなど注意を促すバッジか */
  isWarning: boolean;
  raw: ItemRecord;
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

/** 持ち物一覧を返す(ITM-50)。分類・キーワード(名称/タグ: ITM-02)で絞り込む。 */
export function useItems(category: string, keyword = ''): ItemsResult {
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
      raw: record,
    };
  });

  const trimmedKeyword = keyword.trim();
  const items = decorated
    .filter((item) => {
      if (category === 'all') return true;
      if (category === 'warning') return item.isWarning;
      return item.category === category;
    })
    .filter((item) => {
      if (!trimmedKeyword) return true;
      return (
        item.name.includes(trimmedKeyword) ||
        item.raw.tags.some((tag) => tag.includes(trimmedKeyword)) ||
        (item.raw.location ?? '').includes(trimmedKeyword)
      );
    });

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

/** 持ち物を作成・更新する(ITM-52)。 */
export function useSaveItem(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { itemId?: string; input: CreateItemInput }>({
    mutationFn: async ({ itemId, input }) => {
      if (!userId) throw new Error('ログインが必要です');
      if (itemId) await itemsRepo.update(supabase, itemId, input);
      else await itemsRepo.create(supabase, userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}
