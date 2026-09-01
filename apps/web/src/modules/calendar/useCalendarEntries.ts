import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CalendarEventRecord, CreateEventInput, ModuleKey } from '@recodock/shared';
import {
  entriesRepo,
  eventsRepo,
  expandOccurrences,
  formatAmount,
  formatTime,
  queryKeys,
} from '@recodock/shared';

import { useUserModules } from '../../core/userModules';
import { monthGridRange, monthIsoRange, toDateKey, toMonthKey } from '../../lib/monthRange';
import { supabase } from '../../lib/supabase';

/** 日付セルに置く予定(CAL-10)。繰り返しは展開後の1回ぶん。 */
export interface CalendarEvent {
  id: string;
  /** 元の予定(events.id)。CAL-11 詳細を開くときに使う */
  eventId: string;
  /** この回の発生日時(ISO)。繰り返しの例外操作(CAL-01)に使う */
  occurrenceIso: string;
  title: string;
  /** 表示用の時刻。終日・時刻未設定は undefined */
  time?: string;
  /** 終日予定(events.is_all_day)。セルに「終日」と出す */
  isAllDay?: boolean;
}

/** calendar_entries ビューから集約したモジュール別の件数バッジ(CAL-04)。 */
export interface CalendarBadge {
  moduleKey: ModuleKey;
  count: number;
}

/** 1 日ぶんの集約。 */
export interface CalendarDay {
  events: readonly CalendarEvent[];
  badges: readonly CalendarBadge[];
}

/** 日別記録一覧(CAL-13)の 1 行。 */
export interface DayEntryRow {
  id: string;
  /** 時刻、または家計簿の金額 */
  lead: string;
  title: string;
  sub: string;
}

/** モジュールごとにまとめた日別記録(CAL-13)。 */
export interface DayEntrySection {
  moduleKey: ModuleKey;
  /** 見出し(例: 予定 · Reco Calendar) */
  label: string;
  rows: readonly DayEntryRow[];
}

/** 右ペインの「今日の記録」カード(SC-04)。 */
export interface TodayEntry {
  id: string;
  moduleKey: ModuleKey;
  moduleLabel: string;
  title: string;
  sub: string;
}

const MODULE_LABELS: Readonly<Record<ModuleKey, string>> = {
  calendar: 'カレンダー',
  money: '家計簿',
  diary: '日記',
  items: '持ち物',
  notes: 'メモ',
  map: '地図',
};

const MODULE_BRANDS: Readonly<Record<ModuleKey, string>> = {
  calendar: '予定 · Reco Calendar',
  money: '家計簿 · Reco Money',
  diary: '日記 · Reco Diary',
  items: '持ち物 · Reco Items',
  notes: 'メモ · Reco Notes',
  map: '地図 · Reco Map',
};

export interface CalendarMonthResult {
  /** YYYY-MM-DD → その日の集約 */
  daysByDate: ReadonlyMap<string, CalendarDay>;
  /** CAL-11 詳細用に元の予定を引けるようにする */
  eventsById: ReadonlyMap<string, CalendarEventRecord>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * 月の集約(予定・モジュール別バッジ)を返す(CAL-10 / CAL-04)。
 * 予定は events から取って繰り返しを展開し、バッジは calendar_entries ビューから集約する。
 */
export function useCalendarMonth(month: Date): CalendarMonthResult {
  const grid = monthGridRange(month);
  const iso = monthIsoRange(month);

  const { addedKeys } = useUserModules();

  const entriesQuery = useQuery({
    queryKey: queryKeys.core.calendarEntries(toMonthKey(month)),
    queryFn: () => entriesRepo.listCalendarEntries(supabase, grid.from, grid.to),
  });

  const eventsQuery = useQuery({
    queryKey: queryKeys.calendar.events(toMonthKey(month)),
    queryFn: () => eventsRepo.listByRange(supabase, iso.fromIso, iso.toIso),
  });

  // 繰り返しの「この回だけ削除」(event_overrides)を展開から除外する
  const overridesQuery = useQuery({
    queryKey: queryKeys.calendar.event(`overrides-${toMonthKey(month)}`),
    queryFn: () => eventsRepo.listCanceledOccurrences(supabase, iso.fromIso, iso.toIso),
  });

  const daysByDate = new Map<string, CalendarDay>();
  const ensure = (dateKey: string): { events: CalendarEvent[]; badges: CalendarBadge[] } => {
    const existing = daysByDate.get(dateKey);
    if (existing) return existing as { events: CalendarEvent[]; badges: CalendarBadge[] };
    const created = { events: [], badges: [] };
    daysByDate.set(dateKey, created);
    return created;
  };

  // 予定(繰り返しを展開してセルに置く)。「この回だけ削除」は除外する(CAL-01)
  const rangeStart = new Date(iso.fromIso);
  const rangeEnd = new Date(iso.toIso);
  const eventsById = new Map<string, CalendarEventRecord>();
  const canceledByEvent = new Map<string, Date[]>();
  for (const override of overridesQuery.data ?? []) {
    const dates = canceledByEvent.get(override.eventId) ?? [];
    dates.push(new Date(override.occurrenceIso));
    canceledByEvent.set(override.eventId, dates);
  }
  for (const event of eventsQuery.data ?? []) {
    eventsById.set(event.id, event);
    for (const occurrence of expandOccurrences(
      new Date(event.startsAt),
      event.rrule,
      rangeStart,
      rangeEnd,
      canceledByEvent.get(event.id) ?? [],
    )) {
      ensure(toDateKey(occurrence)).events.push({
        id: `${event.id}-${occurrence.toISOString()}`,
        eventId: event.id,
        occurrenceIso: occurrence.toISOString(),
        title: event.title,
        time: event.isAllDay ? undefined : formatTime(occurrence),
        isAllDay: event.isAllDay,
      });
    }
  }

  // モジュール別の件数バッジ(予定はセルに直接出すので除く)。
  // 無効化されたモジュールの記録は表示から除外する(01_screen_design.md 4 章。データは残る: FR-01)
  for (const entry of entriesQuery.data ?? []) {
    if (entry.moduleKey === 'calendar') continue;
    if (!addedKeys.includes(entry.moduleKey)) continue;
    const day = ensure(entry.entryDate);
    const badge = day.badges.find((b) => b.moduleKey === entry.moduleKey);
    if (badge) badge.count += 1;
    else day.badges.push({ moduleKey: entry.moduleKey, count: 1 });
  }

  return {
    daysByDate,
    eventsById,
    isLoading: entriesQuery.isPending || eventsQuery.isPending,
    isError: entriesQuery.isError || eventsQuery.isError || overridesQuery.isError,
    refetch: () => {
      void entriesQuery.refetch();
      void eventsQuery.refetch();
      void overridesQuery.refetch();
    },
  };
}

export interface TodayEntriesResult {
  entries: readonly TodayEntry[];
  isLoading: boolean;
  isError: boolean;
}

/** 選択日の記録サマリ(SC-04 右ペイン)。 */
export function useTodayEntries(date: Date): TodayEntriesResult {
  const dateKey = toDateKey(date);
  const { addedKeys } = useUserModules();
  const query = useQuery({
    queryKey: queryKeys.core.dayEntries(dateKey),
    queryFn: () => entriesRepo.listCalendarEntries(supabase, dateKey, dateKey),
  });

  const entries: TodayEntry[] = (query.data ?? [])
    .filter((entry) => addedKeys.includes(entry.moduleKey))
    .map((entry) => ({
      id: `${entry.moduleKey}-${entry.entryId}`,
      moduleKey: entry.moduleKey,
      moduleLabel: MODULE_LABELS[entry.moduleKey],
      title: entry.title,
      sub: MODULE_BRANDS[entry.moduleKey],
    }));

  return { entries, isLoading: query.isPending, isError: query.isError };
}

export interface DayEntriesResult {
  sections: readonly DayEntrySection[];
  isLoading: boolean;
  isError: boolean;
}

/** 日別記録一覧(CAL-13)。モジュールごとにまとめて返す。 */
export function useDayEntries(date: Date): DayEntriesResult {
  const dateKey = toDateKey(date);
  const { addedKeys } = useUserModules();

  const entriesQuery = useQuery({
    queryKey: queryKeys.core.dayEntries(dateKey),
    queryFn: () => entriesRepo.listCalendarEntries(supabase, dateKey, dateKey),
  });

  const eventsQuery = useQuery({
    queryKey: queryKeys.calendar.events(dateKey),
    queryFn: () =>
      eventsRepo.listByRange(
        supabase,
        new Date(`${dateKey}T00:00:00`).toISOString(),
        new Date(`${dateKey}T23:59:59`).toISOString(),
      ),
  });

  const byModule = new Map<ModuleKey, DayEntryRow[]>();
  const push = (moduleKey: ModuleKey, row: DayEntryRow) => {
    const rows = byModule.get(moduleKey);
    if (rows) rows.push(row);
    else byModule.set(moduleKey, [row]);
  };

  for (const event of eventsQuery.data ?? []) {
    push('calendar', {
      id: event.id,
      lead: event.isAllDay ? '終日' : formatTime(new Date(event.startsAt)),
      title: event.title,
      sub: event.location ?? '',
    });
  }

  for (const entry of entriesQuery.data ?? []) {
    if (entry.moduleKey === 'calendar') continue;
    if (!addedKeys.includes(entry.moduleKey)) continue;
    push(entry.moduleKey, {
      id: entry.entryId,
      lead: '',
      title: entry.title,
      sub: MODULE_LABELS[entry.moduleKey],
    });
  }

  const sections: DayEntrySection[] = [...byModule].map(([moduleKey, rows]) => ({
    moduleKey,
    label: MODULE_BRANDS[moduleKey],
    rows,
  }));

  return {
    sections,
    isLoading: entriesQuery.isPending || eventsQuery.isPending,
    isError: entriesQuery.isError || eventsQuery.isError,
  };
}

/** 金額を「支出 3件 ¥3,300」のように畳んで見せるための整形。 */
export function summarizeAmount(total: number, count: number): string {
  return `支出 ${count}件 ${formatAmount(total)}`;
}

/** 予定を更新する(CAL-12 の編集。繰り返しはすべての回に反映)。 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation<
    CalendarEventRecord,
    Error,
    { eventId: string; input: Partial<CreateEventInput> }
  >({
    mutationFn: ({ eventId, input }) => eventsRepo.update(supabase, eventId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 予定を削除する(単発、または繰り返しのすべての回)。 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (eventId) => eventsRepo.remove(supabase, eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 繰り返しの「この回だけ削除」(event_overrides: CAL-01)。 */
export function useCancelOccurrence(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { eventId: string; occurrenceIso: string }>({
    mutationFn: ({ eventId, occurrenceIso }) => {
      if (!userId) throw new Error('ログインが必要です');
      return eventsRepo.cancelOccurrence(supabase, userId, eventId, occurrenceIso);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 予定のリマインド設定を取得する(CAL-11)。 */
export function useEventReminders(eventId: string | undefined): readonly number[] {
  const query = useQuery({
    queryKey: queryKeys.calendar.event(`reminders-${eventId ?? ''}`),
    queryFn: () => eventsRepo.listReminders(supabase, eventId ?? ''),
    enabled: Boolean(eventId),
  });
  return query.data ?? [];
}

/** 予定を作成する(CAL-12)。成功したらカレンダー系のクエリを再取得する。 */
export function useCreateEvent(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<CalendarEventRecord, Error, CreateEventInput>({
    mutationFn: (input) => {
      if (!userId) throw new Error('ログインが必要です');
      return eventsRepo.create(supabase, userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}
