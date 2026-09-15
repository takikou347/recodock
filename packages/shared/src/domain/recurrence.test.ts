import { describe, expect, it } from 'vitest';

import { expandOccurrences, parseRrule } from './recurrence';

const d = (y: number, m: number, day: number, h = 0, min = 0, sec = 0) =>
  new Date(y, m - 1, day, h, min, sec);

describe('parseRrule', () => {
  it('FREQ と INTERVAL と BYDAY を読む', () => {
    expect(parseRrule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,SA')).toEqual({
      freq: 'WEEKLY',
      interval: 2,
      byWeekday: [1, 6],
      until: undefined,
      count: undefined,
    });
  });

  it('RRULE: の接頭辞を許容する', () => {
    expect(parseRrule('RRULE:FREQ=DAILY')?.freq).toBe('DAILY');
  });

  it('UNTIL を日時として読む', () => {
    expect(parseRrule('FREQ=DAILY;UNTIL=20260930T235959Z')?.until).toEqual(
      d(2026, 9, 30, 23, 59, 59),
    );
  });

  it('未対応の FREQ は null を返す', () => {
    expect(parseRrule('FREQ=YEARLY')).toBeNull();
  });

  it('壊れた INTERVAL は null を返す', () => {
    expect(parseRrule('FREQ=DAILY;INTERVAL=0')).toBeNull();
  });

  it('COUNT=0 は null を返す', () => {
    expect(parseRrule('FREQ=DAILY;COUNT=0')).toBeNull();
  });

  it('壊れた UNTIL は null を返す', () => {
    expect(parseRrule('FREQ=DAILY;UNTIL=2026-09-30')).toBeNull();
  });

  it('未知の BYDAY コードは捨てて、開始日の曜日にフォールバックさせる', () => {
    expect(parseRrule('FREQ=WEEKLY;BYDAY=XX')?.byWeekday).toEqual([]);
  });
});

describe('expandOccurrences(CAL-03)', () => {
  it('rrule が無い予定は範囲に入っていれば1件だけ返す', () => {
    const start = d(2026, 8, 22, 17);
    expect(expandOccurrences(start, null, d(2026, 8, 1), d(2026, 8, 31, 23, 59))).toEqual([start]);
  });

  it('rrule が無く範囲外なら0件', () => {
    const start = d(2026, 7, 22, 17);
    expect(expandOccurrences(start, null, d(2026, 8, 1), d(2026, 8, 31, 23, 59))).toEqual([]);
  });

  it('毎週土曜を1か月ぶん展開し、開始時刻を保つ', () => {
    const start = d(2026, 8, 1, 17, 30);
    const result = expandOccurrences(
      start,
      'FREQ=WEEKLY;BYDAY=SA',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result).toEqual([
      d(2026, 8, 1, 17, 30),
      d(2026, 8, 8, 17, 30),
      d(2026, 8, 15, 17, 30),
      d(2026, 8, 22, 17, 30),
      d(2026, 8, 29, 17, 30),
    ]);
  });

  it('INTERVAL=2 は隔週になる', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 15, 29]);
  });

  it('COUNT で打ち切る', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=DAILY;COUNT=3',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 2, 3]);
  });

  it('UNTIL を過ぎた回は含めない', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=DAILY;UNTIL=20260804T000000Z',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 2, 3]);
  });

  it('範囲より前に始まる繰り返しでも、範囲内の回だけ返す', () => {
    const result = expandOccurrences(
      d(2026, 6, 1, 9),
      'FREQ=MONTHLY',
      d(2026, 8, 1),
      d(2026, 9, 30, 23, 59),
    );
    expect(result).toEqual([d(2026, 8, 1, 9), d(2026, 9, 1, 9)]);
  });

  it('毎月31日は、31日が無い月を飛ばす', () => {
    const result = expandOccurrences(
      d(2026, 1, 31, 9),
      'FREQ=MONTHLY',
      d(2026, 1, 1),
      d(2026, 5, 31, 23, 59),
    );
    expect(result.map((x) => `${x.getMonth() + 1}/${x.getDate()}`)).toEqual([
      '1/31',
      '3/31',
      '5/31',
    ]);
  });

  it('除外日(event_overrides の取り消し)は含めない', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=WEEKLY;BYDAY=SA',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
      [d(2026, 8, 15)],
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 8, 22, 29]);
  });

  it('解釈できない rrule は単発予定として扱う', () => {
    const start = d(2026, 8, 22, 17);
    expect(expandOccurrences(start, 'FREQ=HOURLY', d(2026, 8, 1), d(2026, 8, 31, 23, 59))).toEqual([
      start,
    ]);
  });

  // 候補の生成上限を「返す件数」と同じにしていたため、開始が表示範囲から
  // 1000 日以上前にある毎日の予定がカレンダーから丸ごと消えていた
  it('何年も前から続く毎日の予定も、表示範囲の回を返す', () => {
    const result = expandOccurrences(
      d(2020, 1, 1, 9),
      'FREQ=DAILY',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result).toHaveLength(31);
    expect(result[0]).toEqual(d(2026, 8, 1, 9));
    expect(result.at(-1)).toEqual(d(2026, 8, 31, 9));
  });

  it('COUNT は表示範囲の外の回も数える', () => {
    // 7/30 から 3 回 = 7/30・7/31・8/1。範囲に入るのは 8/1 だけ
    const result = expandOccurrences(
      d(2026, 7, 30, 9),
      'FREQ=DAILY;COUNT=3',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result).toEqual([d(2026, 8, 1, 9)]);
  });

  it('events.rrule_until を渡すと、その日以降を打ち切る', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=DAILY',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
      [],
      d(2026, 8, 3, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 2, 3]);
  });

  it('rrule_until と RRULE の UNTIL が両方あるときは早いほうで打ち切る', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=DAILY;UNTIL=20260810T235959Z',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
      [],
      d(2026, 8, 5, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 2, 3, 4, 5]);
  });

  it('壊れた rrule_until は無視する', () => {
    const result = expandOccurrences(
      d(2026, 8, 1, 9),
      'FREQ=DAILY;COUNT=2',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
      [],
      'not-a-date',
    );
    expect(result.map((x) => x.getDate())).toEqual([1, 2]);
  });

  it('うるう年の 2/29 は、うるう年の月だけに出る', () => {
    const result = expandOccurrences(
      d(2028, 1, 29, 9),
      'FREQ=MONTHLY',
      d(2028, 1, 1),
      d(2028, 3, 31, 23, 59),
    );
    expect(result.map((x) => `${x.getMonth() + 1}/${x.getDate()}`)).toEqual([
      '1/29',
      '2/29',
      '3/29',
    ]);
  });

  it('平年の 1/29 始まりは 2 月を飛ばす', () => {
    const result = expandOccurrences(
      d(2027, 1, 29, 9),
      'FREQ=MONTHLY',
      d(2027, 1, 1),
      d(2027, 3, 31, 23, 59),
    );
    expect(result.map((x) => `${x.getMonth() + 1}/${x.getDate()}`)).toEqual(['1/29', '3/29']);
  });

  it('開始日の曜日が BYDAY に含まれないときは BYDAY 側に従う', () => {
    // 火曜に作った予定を「毎週土曜」にした場合、初回は開始日より後の土曜
    const result = expandOccurrences(
      d(2026, 8, 4, 9),
      'FREQ=WEEKLY;BYDAY=SA',
      d(2026, 8, 1),
      d(2026, 8, 31, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([8, 15, 22, 29]);
  });

  it('BYDAY が複数あると同じ週に複数回出る', () => {
    const result = expandOccurrences(
      d(2026, 8, 3, 9),
      'FREQ=WEEKLY;BYDAY=MO,WE',
      d(2026, 8, 1),
      d(2026, 8, 15, 23, 59),
    );
    expect(result.map((x) => x.getDate())).toEqual([3, 5, 10, 12]);
  });
});
