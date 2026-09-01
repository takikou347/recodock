// 予定(CAL)のリポジトリ関数。supabase-js を使ってよいのはこの層のみ(ADR-0004)。
import type { RecodockClient } from '../supabase/client';
import { unwrap, unwrapVoid } from './errors';

/** ドメイン型の予定。DB の snake_case からここで camelCase に変換する。 */
export interface CalendarEventRecord {
  id: string;
  title: string;
  /** ISO 8601 */
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location: string | null;
  memo: string | null;
  /** RFC 5545 の RRULE。繰り返さない場合は null */
  rrule: string | null;
  rruleUntil: string | null;
}

export interface CreateEventInput {
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay?: boolean;
  location?: string | null;
  memo?: string | null;
  rrule?: string | null;
}

interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  is_all_day: boolean;
  location: string | null;
  memo: string | null;
  rrule: string | null;
  rrule_until: string | null;
}

const COLUMNS = 'id, title, starts_at, ends_at, is_all_day, location, memo, rrule, rrule_until';

function toDomain(row: EventRow): CalendarEventRecord {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isAllDay: row.is_all_day,
    location: row.location,
    memo: row.memo,
    rrule: row.rrule,
    rruleUntil: row.rrule_until,
  };
}

/** 指定期間に開始する予定を取得する(CAL-10)。繰り返しの展開は呼び出し側で行う。 */
export async function listByRange(
  client: RecodockClient,
  fromIso: string,
  toIso: string,
): Promise<CalendarEventRecord[]> {
  const result = await client
    .from('events')
    .select(COLUMNS)
    .lt('starts_at', toIso)
    .gte('ends_at', fromIso)
    .order('starts_at');
  return unwrap(result).map(toDomain);
}

/** 予定を作成する(CAL-11 / CAL-12)。 */
export async function create(
  client: RecodockClient,
  userId: string,
  input: CreateEventInput,
): Promise<CalendarEventRecord> {
  const result = await client
    .from('events')
    .insert({
      user_id: userId,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_all_day: input.isAllDay ?? false,
      location: input.location ?? null,
      memo: input.memo ?? null,
      rrule: input.rrule ?? null,
    })
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 予定を更新する(CAL-12)。 */
export async function update(
  client: RecodockClient,
  eventId: string,
  input: Partial<CreateEventInput>,
): Promise<CalendarEventRecord> {
  const result = await client
    .from('events')
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.startsAt !== undefined && { starts_at: input.startsAt }),
      ...(input.endsAt !== undefined && { ends_at: input.endsAt }),
      ...(input.isAllDay !== undefined && { is_all_day: input.isAllDay }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.memo !== undefined && { memo: input.memo }),
      ...(input.rrule !== undefined && { rrule: input.rrule }),
    })
    .eq('id', eventId)
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 予定を削除する。 */
export async function remove(client: RecodockClient, eventId: string): Promise<void> {
  unwrapVoid(await client.from('events').delete().eq('id', eventId));
}

/** 繰り返しの例外(この回だけ削除: CAL-01)。occurrenceIso は元の発生日時。 */
export async function cancelOccurrence(
  client: RecodockClient,
  userId: string,
  eventId: string,
  occurrenceIso: string,
): Promise<void> {
  unwrapVoid(
    await client.from('event_overrides').upsert(
      {
        user_id: userId,
        event_id: eventId,
        occurrence_date: occurrenceIso,
        is_canceled: true,
      },
      { onConflict: 'event_id,occurrence_date' },
    ),
  );
}

/** 取り消し済みの発生日時一覧を取得する(展開時の除外に使う)。 */
export async function listCanceledOccurrences(
  client: RecodockClient,
  fromIso: string,
  toIso: string,
): Promise<{ eventId: string; occurrenceIso: string }[]> {
  const result = await client
    .from('event_overrides')
    .select('event_id, occurrence_date')
    .eq('is_canceled', true)
    .gte('occurrence_date', fromIso)
    .lt('occurrence_date', toIso);
  return unwrap(result).map((row) => ({
    eventId: row.event_id,
    occurrenceIso: row.occurrence_date,
  }));
}

/** 予定のリマインド設定(分前)を取得する(CAL-11)。 */
export async function listReminders(client: RecodockClient, eventId: string): Promise<number[]> {
  const result = await client
    .from('event_reminders')
    .select('minutes_before')
    .eq('event_id', eventId)
    .order('minutes_before');
  return unwrap(result).map((row) => row.minutes_before);
}

/** 予定のリマインド(分前)を置き換える(CAL-14)。 */
export async function replaceReminders(
  client: RecodockClient,
  userId: string,
  eventId: string,
  minutesBefore: readonly number[],
): Promise<void> {
  unwrapVoid(await client.from('event_reminders').delete().eq('event_id', eventId));
  if (minutesBefore.length === 0) return;
  unwrapVoid(
    await client.from('event_reminders').insert(
      minutesBefore.map((minutes) => ({
        user_id: userId,
        event_id: eventId,
        minutes_before: minutes,
      })),
    ),
  );
}
