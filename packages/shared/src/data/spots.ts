// 地図スポット(MAP)のリポジトリ関数。
import type { RecodockClient } from '../supabase/client';
import { unwrap, unwrapVoid } from './errors';

/** スポットの状態。DB の CHECK 制約と一致させる。 */
export type SpotStatus = 'visited' | 'wishlist';

export interface SpotRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SpotStatus;
  /** YYYY-MM-DD */
  visitedOn: string | null;
  memo: string | null;
}

export interface CreateSpotInput {
  name: string;
  latitude: number;
  longitude: number;
  status: SpotStatus;
  visitedOn?: string | null;
  memo?: string | null;
}

const COLUMNS = 'id, name, latitude, longitude, status, visited_on, memo';

interface SpotRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  visited_on: string | null;
  memo: string | null;
}

function toDomain(row: SpotRow): SpotRecord {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status as SpotStatus,
    visitedOn: row.visited_on,
    memo: row.memo,
  };
}

/** スポット一覧(MAP-70)。status を渡すとその状態だけ返す。 */
export async function list(client: RecodockClient, status?: SpotStatus): Promise<SpotRecord[]> {
  let query = client.from('spots').select(COLUMNS).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  return unwrap(await query).map(toDomain);
}

/** スポットを登録する(MAP-71)。 */
export async function create(
  client: RecodockClient,
  userId: string,
  input: CreateSpotInput,
): Promise<SpotRecord> {
  const result = await client
    .from('spots')
    .insert({
      user_id: userId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      status: input.status,
      visited_on: input.visitedOn ?? null,
      memo: input.memo ?? null,
    })
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** スポットを削除する。 */
export async function remove(client: RecodockClient, spotId: string): Promise<void> {
  unwrapVoid(await client.from('spots').delete().eq('id', spotId));
}
