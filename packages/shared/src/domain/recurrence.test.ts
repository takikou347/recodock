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
});
