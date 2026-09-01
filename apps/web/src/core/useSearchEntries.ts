import { useMemo } from 'react';

import type { ModuleKey } from '@recodock/shared';

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

// TODO: search_entries ビューを引くリポジトリ関数＋TanStack Query に差し替える。
// 現在はデザイン(SC-07)のサンプルを表示する。
const SAMPLE_ENTRIES: readonly SearchEntry[] = [
  {
    id: 'diary-1',
    moduleKey: 'diary',
    moduleLabel: '日記',
    title: '夏のはじまり、川沿いを歩いた',
    snippet: '…夕方から鴨川沿いを1時間ほど歩いた…',
    date: '08/21',
    href: '/diary',
  },
  {
    id: 'map-1',
    moduleKey: 'map',
    moduleLabel: '地図',
    title: '鴨川 三条',
    snippet: '訪問済み ／ 関連日記 1件',
    date: '08/21',
    href: '/map',
  },
  {
    id: 'event-1',
    moduleKey: 'calendar',
    moduleLabel: '予定',
    title: '散歩(鴨川)',
    snippet: '17:00-18:00 ／ 繰り返しなし',
    date: '08/22',
    href: '/',
  },
  {
    id: 'note-1',
    moduleKey: 'notes',
    moduleLabel: 'メモ',
    title: '鴨川で読む本リスト',
    snippet: '- 積読の消化 - 文庫を2冊…',
    date: '08/18',
    href: '/notes',
  },
  {
    id: 'map-2',
    moduleKey: 'map',
    moduleLabel: '地図',
    title: '鴨川デルタ',
    snippet: '行きたい ／ メモあり',
    date: '07/30',
    href: '/map',
  },
];

export interface SearchEntriesResult {
  entries: readonly SearchEntry[];
  /** モジュール別の件数(フィルタチップに出す) */
  countsByModule: ReadonlyMap<ModuleKey, number>;
  isLoading: boolean;
  isError: boolean;
}

/** 横断検索の結果を返す(SC-07)。query が空のときは全件を返す。 */
export function useSearchEntries(query: string): SearchEntriesResult {
  return useMemo(() => {
    const keyword = query.trim();
    const entries = keyword
      ? SAMPLE_ENTRIES.filter(
          (entry) => entry.title.includes(keyword) || entry.snippet.includes(keyword),
        )
      : SAMPLE_ENTRIES;

    const countsByModule = new Map<ModuleKey, number>();
    for (const entry of entries) {
      countsByModule.set(entry.moduleKey, (countsByModule.get(entry.moduleKey) ?? 0) + 1);
    }

    return { entries, countsByModule, isLoading: false, isError: false };
  }, [query]);
}
