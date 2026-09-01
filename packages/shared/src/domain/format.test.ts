import { describe, expect, it } from 'vitest';

import {
  formatAmount,
  formatDateValue,
  formatFullDate,
  formatHeadingDate,
  formatListDate,
  formatTime,
  formatYearMonth,
} from './format';

// 2026/08/22 は土曜
const saturday = new Date(2026, 7, 22, 17, 0);
// 2026/08/02 は日曜(1桁の月日でゼロ埋めを確認する)
const sunday = new Date(2026, 7, 2, 9, 5);

describe('日付の表記(1e 表記規則)', () => {
  it('見出しはゼロ埋めせず曜日を括弧で添える', () => {
    expect(formatHeadingDate(saturday)).toBe('8月22日(土)');
    expect(formatHeadingDate(sunday)).toBe('8月2日(日)');
  });

  it('フル日付はゼロ埋めしたスラッシュ区切りに曜日を添える', () => {
    expect(formatFullDate(saturday)).toBe('2026/08/22 (土)');
  });

  it('フォーム入力の日付は曜日を含めない', () => {
    expect(formatDateValue(sunday)).toBe('2026/08/02');
  });

  it('リスト内は月日のみをゼロ埋めする', () => {
    expect(formatListDate(saturday)).toBe('08/22');
    expect(formatListDate(sunday)).toBe('08/02');
  });

  it('年月の見出しは月をゼロ埋めしない', () => {
    expect(formatYearMonth(saturday)).toBe('2026年 8月');
  });
});

describe('時刻の表記(24時間制)', () => {
  it('時と分をゼロ埋めする', () => {
    expect(formatTime(saturday)).toBe('17:00');
    expect(formatTime(sunday)).toBe('09:05');
  });
});

describe('金額の表記', () => {
  it('支出は負号付きで3桁区切りにする', () => {
    expect(formatAmount(-1280)).toBe('-¥1,280');
  });

  it('収入は showsPlusSign のときだけ + を付ける', () => {
    expect(formatAmount(280000, { showsPlusSign: true })).toBe('+¥280,000');
    expect(formatAmount(280000)).toBe('¥280,000');
  });

  it('0 は符号を付けない', () => {
    expect(formatAmount(0, { showsPlusSign: true })).toBe('¥0');
  });
});
