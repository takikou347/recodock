/**
 * Web 固有の表示ヘルパー。
 * 日付・時刻・金額の表記規則そのものは @recodock/shared の domain/format(iOS と共有)を使う。
 */

/**
 * 曜日の色分け: 日=赤 / 土=青 / 平日=既定。
 * 色を持たないのが既定だが(ADR-0008)、日本のカレンダーでは曜日の色が情報なので、
 * Tailwind の標準パレットから 2 色だけ使う。
 */
export function weekdayTextClass(dayOfWeek: number): string {
  if (dayOfWeek === 0) return 'text-red-600 dark:text-red-400';
  if (dayOfWeek === 6) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
}
