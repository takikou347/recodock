// 日記(DIA)のリポジトリ関数。
import type { RecodockClient } from '../supabase/client';
import { unwrap, unwrapVoid } from './errors';

/** 気分タグ。DB の CHECK 制約と一致させる。 */
export type DiaryMood = 'great' | 'good' | 'normal' | 'bad' | 'awful';

export interface DiaryRecord {
  id: string;
  /** YYYY-MM-DD */
  entryDate: string;
  body: string;
  mood: DiaryMood | null;
  latitude: number | null;
  longitude: number | null;
  spotId: string | null;
  updatedAt: string;
}

export interface UpsertDiaryInput {
  entryDate: string;
  body: string;
  mood?: DiaryMood | null;
  latitude?: number | null;
  longitude?: number | null;
  spotId?: string | null;
}

interface DiaryRow {
  id: string;
  entry_date: string;
  body: string;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  spot_id: string | null;
  updated_at: string;
}

const COLUMNS = 'id, entry_date, body, mood, latitude, longitude, spot_id, updated_at';

function toDomain(row: DiaryRow): DiaryRecord {
  return {
    id: row.id,
    entryDate: row.entry_date,
    body: row.body,
    mood: row.mood as DiaryMood | null,
    latitude: row.latitude,
    longitude: row.longitude,
    spotId: row.spot_id,
    updatedAt: row.updated_at,
  };
}

/** 日記一覧を新しい順に取得する(DIA-40)。keyword は本文の部分一致。 */
export async function list(client: RecodockClient, keyword = ''): Promise<DiaryRecord[]> {
  const trimmed = keyword.trim();
  let query = client.from('diaries').select(COLUMNS).order('entry_date', { ascending: false });
  if (trimmed) query = query.ilike('body', `%${trimmed}%`);
  return unwrap(await query).map(toDomain);
}

/** 1件取得する(DIA-41)。 */
export async function get(client: RecodockClient, diaryId: string): Promise<DiaryRecord> {
  const result = await client.from('diaries').select(COLUMNS).eq('id', diaryId).single();
  return toDomain(unwrap(result));
}

/** 作成する(DIA-42)。 */
export async function create(
  client: RecodockClient,
  userId: string,
  input: UpsertDiaryInput,
): Promise<DiaryRecord> {
  const result = await client
    .from('diaries')
    .insert({
      user_id: userId,
      entry_date: input.entryDate,
      body: input.body,
      mood: input.mood ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      spot_id: input.spotId ?? null,
    })
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 更新する(DIA-42 の自動保存)。 */
export async function update(
  client: RecodockClient,
  diaryId: string,
  input: Partial<UpsertDiaryInput>,
): Promise<DiaryRecord> {
  const result = await client
    .from('diaries')
    .update({
      ...(input.entryDate !== undefined && { entry_date: input.entryDate }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.mood !== undefined && { mood: input.mood }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.spotId !== undefined && { spot_id: input.spotId }),
    })
    .eq('id', diaryId)
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 削除する(DIA-41 の削除)。 */
export async function remove(client: RecodockClient, diaryId: string): Promise<void> {
  unwrapVoid(await client.from('diaries').delete().eq('id', diaryId));
}

/** スポットに紐づく日記(MAP-71 の「関連日記への導線」)。 */
export async function listBySpot(client: RecodockClient, spotId: string): Promise<DiaryRecord[]> {
  const result = await client
    .from('diaries')
    .select(COLUMNS)
    .eq('spot_id', spotId)
    .order('entry_date', { ascending: false });
  return unwrap(result).map(toDomain);
}

/** 指定日の日記(DIA-04「1年前の今日」)。 */
export async function listByDate(
  client: RecodockClient,
  entryDate: string,
): Promise<DiaryRecord[]> {
  const result = await client
    .from('diaries')
    .select(COLUMNS)
    .eq('entry_date', entryDate)
    .order('created_at');
  return unwrap(result).map(toDomain);
}

/** 日記に紐づく写真(diary_photos)。本文の image ブロックはこの asset を参照する。 */
export interface DiaryPhotoRecord {
  id: string;
  storagePath: string;
  sortOrder: number;
}

export async function listPhotos(
  client: RecodockClient,
  diaryId: string,
): Promise<DiaryPhotoRecord[]> {
  const result = await client
    .from('diary_photos')
    .select('id, storage_path, sort_order')
    .eq('diary_id', diaryId)
    .order('sort_order');
  return unwrap(result).map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
  }));
}
