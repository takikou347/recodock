// 集約ビュー(calendar_entries / search_entries / map_entries)のリポジトリ関数。
// 各ビューは security_invoker のため基底テーブルの RLS がそのまま効く(FR-04)。
import { MODULE_KEYS, type ModuleKey } from '../modules/types';
import type { RecodockClient } from '../supabase/client';
import { unwrap } from './errors';

// ビューの列は Postgres 上では NOT NULL を表現できないため、生成型ではすべて nullable になる。
// 実体は NOT NULL の基底列から作られるので、この境界で欠損行を落として型を確定させる
// (コーディング規約 1: 外部データは境界で型を確定させる)。
function isFilled<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** ビューの module 列。MODULE_KEYS に無い値の行は捨てる。 */
function toModuleKey(value: string): ModuleKey | null {
  return (MODULE_KEYS as readonly string[]).includes(value) ? (value as ModuleKey) : null;
}

/** カレンダー集約の1件(CAL-04)。 */
export interface CalendarEntryRecord {
  moduleKey: ModuleKey;
  entryType: string;
  entryId: string;
  /** YYYY-MM-DD(Asia/Tokyo) */
  entryDate: string;
  title: string;
}

/** 横断検索の1件(SC-07)。 */
export interface SearchEntryRecord extends CalendarEntryRecord {
  searchableText: string;
}

/** 地図ピンの1件(MAP-03)。 */
export interface MapEntryRecord {
  moduleKey: ModuleKey;
  entryType: string;
  entryId: string;
  latitude: number;
  longitude: number;
  title: string;
}

/** 指定期間のカレンダー集約を取得する(CAL-04)。 */
export async function listCalendarEntries(
  client: RecodockClient,
  fromDate: string,
  toDate: string,
): Promise<CalendarEntryRecord[]> {
  const result = await client
    .from('calendar_entries')
    .select('module, entry_type, entry_id, entry_date, title')
    .gte('entry_date', fromDate)
    .lte('entry_date', toDate)
    .order('entry_date');
  return unwrap(result).flatMap((row) => {
    const moduleKey = row.module === null ? null : toModuleKey(row.module);
    if (!moduleKey || !isFilled(row.entry_type) || !isFilled(row.entry_id)) return [];
    if (!isFilled(row.entry_date) || !isFilled(row.title)) return [];
    return [
      {
        moduleKey,
        entryType: row.entry_type,
        entryId: row.entry_id,
        entryDate: row.entry_date,
        title: row.title,
      },
    ];
  });
}

/** 全モジュールを横断して検索する(SC-07)。keyword が空なら最近の記録を返す。 */
export async function searchEntries(
  client: RecodockClient,
  keyword: string,
  limit = 50,
): Promise<SearchEntryRecord[]> {
  const trimmed = keyword.trim();
  let query = client
    .from('search_entries')
    .select('module, entry_type, entry_id, entry_date, title, searchable_text')
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (trimmed) {
    // searchable_text は pg_trgm のインデックス対象(02_data_model.md 3.10)
    query = query.ilike('searchable_text', `%${trimmed}%`);
  }

  return unwrap(await query).flatMap((row) => {
    const moduleKey = row.module === null ? null : toModuleKey(row.module);
    if (!moduleKey || !isFilled(row.entry_type) || !isFilled(row.entry_id)) return [];
    if (!isFilled(row.entry_date) || !isFilled(row.title) || !isFilled(row.searchable_text))
      return [];
    return [
      {
        moduleKey,
        entryType: row.entry_type,
        entryId: row.entry_id,
        entryDate: row.entry_date,
        title: row.title,
        searchableText: row.searchable_text,
      },
    ];
  });
}

/** 地図に置くピンを取得する(MAP-03)。 */
export async function listMapEntries(client: RecodockClient): Promise<MapEntryRecord[]> {
  const result = await client
    .from('map_entries')
    .select('module, entry_type, entry_id, latitude, longitude, title');
  return unwrap(result).flatMap((row) => {
    const moduleKey = row.module === null ? null : toModuleKey(row.module);
    if (!moduleKey || !isFilled(row.entry_type) || !isFilled(row.entry_id)) return [];
    if (!isFilled(row.latitude) || !isFilled(row.longitude) || !isFilled(row.title)) return [];
    return [
      {
        moduleKey,
        entryType: row.entry_type,
        entryId: row.entry_id,
        latitude: row.latitude,
        longitude: row.longitude,
        title: row.title,
      },
    ];
  });
}
