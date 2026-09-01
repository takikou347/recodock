import { useMemo } from 'react';

/** 地図に置くピン(MAP-70)。 */
export interface Spot {
  id: string;
  name: string;
  /** 訪問日・関連記録のサマリ */
  summary: string;
  status: SpotStatus;
  /** 地図上の位置(％)。実装時は緯度経度から求める */
  x: number;
  y: number;
  /** そのスポットに紐づく記録の件数 */
  entryCount: number;
}

export type SpotStatus = 'visited' | 'wishlist' | 'diary';

export interface SpotsResult {
  spots: readonly Spot[];
  counts: Readonly<Record<SpotStatus, number>>;
  isLoading: boolean;
  isError: boolean;
}

// TODO: spots / map_entries ビューを引くリポジトリ関数＋TanStack Query に差し替える。
const SAMPLE_SPOTS: readonly Spot[] = [
  {
    id: 's1',
    name: '鴨川 三条',
    summary: '訪問 2026/08/21 ・ 日記 1件',
    status: 'visited',
    x: 18,
    y: 10,
    entryCount: 3,
  },
  { id: 's2', name: '出町柳', summary: '日記 1件', status: 'diary', x: 52, y: 22, entryCount: 1 },
  {
    id: 's3',
    name: '鴨川デルタ',
    summary: '行きたい ／ メモあり',
    status: 'visited',
    x: 30,
    y: 38,
    entryCount: 5,
  },
  {
    id: 's4',
    name: '京都市役所前',
    summary: '予定 2件',
    status: 'wishlist',
    x: 68,
    y: 46,
    entryCount: 2,
  },
  {
    id: 's5',
    name: '四条大橋',
    summary: '訪問 2026/07/30',
    status: 'visited',
    x: 44,
    y: 58,
    entryCount: 1,
  },
];

/** スポット一覧を返す(MAP-70)。status が 'all' 以外ならその状態で絞り込む。 */
export function useSpots(status: SpotStatus | 'all'): SpotsResult {
  return useMemo(() => {
    const spots =
      status === 'all' ? SAMPLE_SPOTS : SAMPLE_SPOTS.filter((spot) => spot.status === status);
    return {
      spots,
      counts: { visited: 24, wishlist: 8, diary: 12 },
      isLoading: false,
      isError: false,
    };
  }, [status]);
}
