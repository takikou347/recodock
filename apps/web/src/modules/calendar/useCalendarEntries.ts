import { useMemo } from 'react';

import type { ModuleKey } from '@recodock/shared';

import { toDateKey } from '../../lib/calendarGrid';

/** 日付セルに置く予定(CAL-10)。 */
export interface CalendarEvent {
  id: string;
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

export interface CalendarMonthResult {
  /** YYYY-MM-DD → その日の集約 */
  daysByDate: ReadonlyMap<string, CalendarDay>;
  isLoading: boolean;
  isError: boolean;
}

// TODO: calendar_entries ビューを引くリポジトリ関数＋TanStack Query に差し替える。
// 現在はデザイン(SC-04)のサンプル月(2026年8月)を表示する。
const SAMPLE_EVENTS: Readonly<Record<number, readonly CalendarEvent[]>> = {
  3: [{ id: 'e3', title: '歯科', time: '10:00' }],
  6: [{ id: 'e6', title: '1on1', time: '14:00' }],
  11: [{ id: 'e11', title: '帰省', isAllDay: true }],
  14: [{ id: 'e14', title: '映画', time: '19:30' }],
  19: [{ id: 'e19', title: '請求書提出' }],
  22: [
    { id: 'e22a', title: '散歩', time: '17:00' },
    { id: 'e22b', title: '読書会', time: '20:00' },
  ],
  26: [{ id: 'e26', title: '定期通院' }],
  29: [{ id: 'e29', title: '引越し見積' }],
};

const SAMPLE_BADGES: Readonly<Record<number, readonly ModuleKey[]>> = {
  1: ['money'],
  2: ['money', 'diary'],
  3: ['money'],
  5: ['diary', 'notes'],
  6: ['money'],
  8: ['money', 'items'],
  10: ['diary'],
  12: ['money', 'notes'],
  13: ['money'],
  15: ['diary', 'map'],
  16: ['money'],
  18: ['items'],
  19: ['money', 'diary'],
  20: ['money'],
  21: ['diary', 'map', 'money'],
  22: ['money', 'diary', 'notes'],
  23: ['money'],
  25: ['notes'],
  27: ['money', 'items'],
};

/** サンプルデータが対象とする月(2026年8月) */
const SAMPLE_YEAR = 2026;
const SAMPLE_MONTH_INDEX = 7;

/** 月の集約(予定・モジュール別バッジ)を返す(CAL-10 / CAL-04)。 */
export function useCalendarMonth(month: Date): CalendarMonthResult {
  return useMemo(() => {
    const daysByDate = new Map<string, CalendarDay>();
    const isSampleMonth =
      month.getFullYear() === SAMPLE_YEAR && month.getMonth() === SAMPLE_MONTH_INDEX;
    if (!isSampleMonth) return { daysByDate, isLoading: false, isError: false };

    const dayNumbers = new Set(
      [...Object.keys(SAMPLE_EVENTS), ...Object.keys(SAMPLE_BADGES)].map(Number),
    );
    for (const day of dayNumbers) {
      const date = new Date(SAMPLE_YEAR, SAMPLE_MONTH_INDEX, day);
      daysByDate.set(toDateKey(date), {
        events: SAMPLE_EVENTS[day] ?? [],
        badges: (SAMPLE_BADGES[day] ?? []).map((moduleKey) => ({
          moduleKey,
          // 家計簿は 1 日に複数件入ることが多い
          count: moduleKey === 'money' ? 2 : 1,
        })),
      });
    }
    return { daysByDate, isLoading: false, isError: false };
  }, [month]);
}

export interface TodayEntriesResult {
  entries: readonly TodayEntry[];
  isLoading: boolean;
  isError: boolean;
}

/** 選択日の記録サマリ(SC-04 右ペイン)。 */
export function useTodayEntries(date: Date): TodayEntriesResult {
  return useMemo(() => {
    const isSampleDay =
      date.getFullYear() === SAMPLE_YEAR &&
      date.getMonth() === SAMPLE_MONTH_INDEX &&
      date.getDate() === 22;
    if (!isSampleDay) return { entries: [], isLoading: false, isError: false };

    return {
      entries: [
        {
          id: 't1',
          moduleKey: 'calendar',
          moduleLabel: 'カレンダー',
          title: '散歩 17:00',
          sub: '鴨川 三条 · リマインド30分前',
        },
        {
          id: 't2',
          moduleKey: 'calendar',
          moduleLabel: 'カレンダー',
          title: '読書会 20:00',
          sub: 'オンライン · 繰り返し(毎週土)',
        },
        {
          id: 't3',
          moduleKey: 'money',
          moduleLabel: '家計簿',
          title: '支出 3件 ¥3,300',
          sub: '食費 ¥1,280 ／ 趣味 ¥1,540 ／ 交通 ¥480',
        },
        {
          id: 't4',
          moduleKey: 'diary',
          moduleLabel: '日記',
          title: '夏のはじまり、川沿いを歩いた',
          sub: '気分: ごきげん ／ 写真 2枚',
        },
      ],
      isLoading: false,
      isError: false,
    };
  }, [date]);
}

export interface DayEntriesResult {
  sections: readonly DayEntrySection[];
  isLoading: boolean;
  isError: boolean;
}

/** 日別記録一覧(CAL-13)。モジュールごとにまとめて返す。 */
export function useDayEntries(date: Date): DayEntriesResult {
  return useMemo(() => {
    const isSampleDay =
      date.getFullYear() === SAMPLE_YEAR &&
      date.getMonth() === SAMPLE_MONTH_INDEX &&
      date.getDate() === 22;
    if (!isSampleDay) return { sections: [], isLoading: false, isError: false };

    return {
      sections: [
        {
          moduleKey: 'calendar',
          label: '予定 · Reco Calendar',
          rows: [
            { id: 'd1', lead: '17:00', title: '散歩(鴨川 三条)', sub: 'リマインド 30分前' },
            { id: 'd2', lead: '20:00', title: '読書会', sub: 'オンライン ／ 毎週土曜' },
          ],
        },
        {
          moduleKey: 'money',
          label: '家計簿 · Reco Money',
          rows: [
            { id: 'd3', lead: '¥1,280', title: 'スーパーで買い物', sub: '食費 ／ 三井住友カード' },
            { id: 'd4', lead: '¥1,540', title: '文庫本 2冊', sub: '趣味 ／ 現金' },
            { id: 'd5', lead: '¥480', title: 'アイスコーヒー', sub: '食費 ／ 現金' },
          ],
        },
        {
          moduleKey: 'diary',
          label: '日記 · Reco Diary',
          rows: [
            {
              id: 'd6',
              lead: '19:40',
              title: '夏のはじまり、川沿いを歩いた',
              sub: 'ごきげん ／ 写真 2枚 ／ 位置情報あり',
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
    };
  }, [date]);
}
