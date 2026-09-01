/**
 * Web 固有の表示ヘルパー。
 * 日付・時刻・金額の表記規則そのものは @recodock/shared の domain/format(iOS と共有)を使う。
 */

/** 曜日の色分け: 日=テラコッタ / 土=青 / 平日=既定。tokens.css の CSS 変数名を返す。 */
export function weekdayColorVar(dayOfWeek: number): string {
  if (dayOfWeek === 0) return 'var(--color-sunday)';
  if (dayOfWeek === 6) return 'var(--color-saturday)';
  return 'var(--color-ink-muted)';
}
