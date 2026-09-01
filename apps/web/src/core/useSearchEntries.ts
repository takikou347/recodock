import { useQuery } from '@tanstack/react-query';

import type { ModuleKey } from '@recodock/shared';
import { entriesRepo, formatListDate, queryKeys } from '@recodock/shared';

import { supabase } from '../lib/supabase';

/** search_entries ビューの 1 行(SC-07)。 */
export interface SearchEntry {
  id: string;
  moduleKey: ModuleKey;
  /** バッジに出す表示名(予定・日記など) */
  moduleLabel: string;
  title: string;
  snippet: string;
  /** リスト内表記の日付: 08/22 */
  date: string;
  /** 結果をクリックしたときの遷移先 */
  href: string;
}

const MODULE_LABELS: Readonly<Record<ModuleKey, string>> = {
  calendar: '予定',
  money: '家計簿',
  diary: '日記',
  items: '持ち物',
  notes: 'メモ',
  map: '地図',
};

const MODULE_HREFS: Readonly<Record<ModuleKey, string>> = {
  calendar: '/',
  money: '/money',
  diary: '/diary',
  items: '/items',
  notes: '/notes',
  map: '/map',
};

/** スニペットに出す本文の長さ。 */
const SNIPPET_LENGTH = 40;

export interface SearchEntriesResult {
  entries: readonly SearchEntry[];
  /** モジュール別の件数(フィルタチップに出す) */
  countsByModule: ReadonlyMap<ModuleKey, number>;
  isLoading: boolean;
  isError: boolean;
}

/** 横断検索の結果を返す(SC-07)。query が空のときは最近の記録を返す。 */
export function useSearchEntries(query: string): SearchEntriesResult {
  const result = useQuery({
    queryKey: queryKeys.core.search(query.trim()),
    queryFn: () => entriesRepo.searchEntries(supabase, query),
  });

  const entries: SearchEntry[] = (result.data ?? []).map((row) => {
    const text = row.searchableText.replace(/\s+/g, ' ').trim();
    return {
      id: `${row.moduleKey}-${row.entryId}`,
      moduleKey: row.moduleKey,
      moduleLabel: MODULE_LABELS[row.moduleKey],
      title: row.title,
      snippet: text.length > SNIPPET_LENGTH ? `…${text.slice(0, SNIPPET_LENGTH)}…` : text,
      date: formatListDate(new Date(`${row.entryDate}T00:00:00`)),
      href: MODULE_HREFS[row.moduleKey],
    };
  });

  const countsByModule = new Map<ModuleKey, number>();
  for (const entry of entries) {
    countsByModule.set(entry.moduleKey, (countsByModule.get(entry.moduleKey) ?? 0) + 1);
  }

  return {
    entries,
    countsByModule,
    isLoading: result.isPending,
    isError: result.isError,
  };
}
