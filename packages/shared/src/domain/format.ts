/**
 * 日付・時刻・金額の表記規則(01_screen_design.md / デザイン 1e「表記規則」)。
 * Web と iOS で同じ表記にするため、純粋関数としてここに集約する。
 * 数値は呼び出し側で等幅(tabular)フォントを当てて桁を揃える。
 */

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 曜日ラベル(日〜土)。カレンダーのヘッダに使う。 */
export const WEEKDAYS: readonly string[] = WEEKDAY_LABELS;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function weekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()] ?? '';
}

/** 見出しの日付: 8月22日(土) */
export function formatHeadingDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日(${weekdayLabel(date)})`;
}

/** フル日付: 2026/08/22 (土) */
export function formatFullDate(date: Date): string {
  return `${formatDateValue(date)} (${weekdayLabel(date)})`;
}

/** フォーム入力に使う日付: 2026/08/22 */
export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** リスト内の日付: 08/22 */
export function formatListDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

/** 年月の見出し: 2026年 8月 */
export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

/** 時刻(24h): 17:00 */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface FormatAmountOptions {
  /** 収入のように、正の値へ明示的に + を付ける */
  showsPlusSign?: boolean;
}

/**
 * 金額: -¥1,280 ／ +¥280,000。
 * 支出は符号なし(または −)、収入は + を付ける。表示色は呼び出し側で決める。
 */
export function formatAmount(amount: number, options?: FormatAmountOptions): string {
  const sign = amount < 0 ? '-' : options?.showsPlusSign && amount > 0 ? '+' : '';
  return `${sign}¥${Math.abs(amount).toLocaleString('ja-JP')}`;
}
