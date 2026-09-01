import { useQuery } from '@tanstack/react-query';

import type { SpotStatus as RepoSpotStatus } from '@recodock/shared';
import type { SpotRecord } from '@recodock/shared';
import { entriesRepo, formatDateValue, queryKeys, spotsRepo } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

/** 地図に置くピン(MAP-70)。日記由来のピンも同じ形で扱う。 */
export interface Spot {
  id: string;
  name: string;
  summary: string;
  status: SpotStatus;
  /** 地図上の位置(％)。緯度経度を表示範囲へ正規化した値 */
  x: number;
  y: number;
  entryCount: number;
  /** スポット行(MAP-71/72 へ渡す)。日記由来のピンは undefined */
  raw?: SpotRecord;
}

/** 表示上の状態。スポットの visited/wishlist に、日記由来のピンを足す。 */
export type SpotStatus = RepoSpotStatus | 'diary';

export interface SpotsResult {
  spots: readonly Spot[];
  counts: Readonly<Record<SpotStatus, number>>;
  isLoading: boolean;
  isError: boolean;
}

/** ピンが端に貼り付かないよう内側に寄せる余白(％)。 */
const PIN_INSET = 10;

/**
 * 緯度経度を表示範囲の 0〜100% に正規化する。
 * 実際の地図タイルを敷くまでの暫定表示で、ピンの相対位置だけを保つ。
 */
function normalize(values: readonly number[]): (value: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  if (!Number.isFinite(span) || span === 0) return () => 50;
  return (value) => PIN_INSET + ((value - min) / span) * (100 - PIN_INSET * 2);
}

/** スポット一覧を返す(MAP-70)。status とキーワード(場所名)で絞り込む。 */
export function useSpots(status: SpotStatus | 'all', keyword = ''): SpotsResult {
  const spotsQuery = useQuery({
    queryKey: queryKeys.map.spots('all'),
    queryFn: () => spotsRepo.list(supabase),
  });

  const entriesQuery = useQuery({
    queryKey: queryKeys.map.spots('entries'),
    queryFn: () => entriesRepo.listMapEntries(supabase),
  });

  const spotRecords = spotsQuery.data ?? [];
  const mapEntries = entriesQuery.data ?? [];

  // 同じスポットに紐づく記録の件数
  const entryCounts = new Map<string, number>();
  for (const entry of mapEntries) {
    entryCounts.set(entry.entryId, (entryCounts.get(entry.entryId) ?? 0) + 1);
  }

  // 日記に直接付いた位置情報は、スポット登録が無くてもピンとして出す
  const spotIds = new Set(spotRecords.map((spot) => spot.id));
  const diaryPins = mapEntries.filter(
    (entry) => entry.moduleKey === 'diary' && !spotIds.has(entry.entryId),
  );

  const latitudes = [
    ...spotRecords.map((spot) => spot.latitude),
    ...diaryPins.map((pin) => pin.latitude),
  ];
  const longitudes = [
    ...spotRecords.map((spot) => spot.longitude),
    ...diaryPins.map((pin) => pin.longitude),
  ];
  const toX = normalize(longitudes);
  // 緯度は北が上なので上下を反転させる
  const toY = normalize(latitudes);

  const all: Spot[] = [
    ...spotRecords.map((spot) => ({
      id: spot.id,
      name: spot.name,
      summary: spot.visitedOn
        ? `訪問 ${formatDateValue(new Date(`${spot.visitedOn}T00:00:00`))}`
        : (spot.memo ?? '行きたい'),
      status: spot.status as SpotStatus,
      x: toX(spot.longitude),
      y: 100 - toY(spot.latitude),
      entryCount: entryCounts.get(spot.id) ?? 1,
      raw: spot,
    })),
    ...diaryPins.map((pin) => ({
      id: pin.entryId,
      name: pin.title,
      summary: '日記の位置情報',
      status: 'diary' as SpotStatus,
      x: toX(pin.longitude),
      y: 100 - toY(pin.latitude),
      entryCount: 1,
    })),
  ];

  const counts: Record<SpotStatus, number> = {
    visited: all.filter((spot) => spot.status === 'visited').length,
    wishlist: all.filter((spot) => spot.status === 'wishlist').length,
    diary: all.filter((spot) => spot.status === 'diary').length,
  };

  const trimmed = keyword.trim();
  const byStatus = status === 'all' ? all : all.filter((spot) => spot.status === status);

  return {
    spots: trimmed ? byStatus.filter((spot) => spot.name.includes(trimmed)) : byStatus,
    counts,
    isLoading: spotsQuery.isPending || entriesQuery.isPending,
    isError: spotsQuery.isError || entriesQuery.isError,
  };
}
