/** 月次クエリの範囲・キーを組み立てるヘルパー。表示は Asia/Tokyo 前提(ビューと揃える)。 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** YYYY-MM。TanStack Query のキーに使う。 */
export function toMonthKey(month: Date): string {
  return `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;
}

/** YYYY-MM-DD。日付カラムの比較に使う。 */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 月の初日と末日(YYYY-MM-DD)。 */
export function monthDateRange(month: Date): { from: string; to: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { from: toDateKey(first), to: toDateKey(last) };
}

/**
 * 月グリッドが実際に表示する 42 日ぶんの範囲(前後月を含む)。
 * カレンダーの集約バッジは画面に見えているセルぶんを取る必要がある。
 */
export function monthGridRange(month: Date): { from: string; to: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);
  return { from: toDateKey(gridStart), to: toDateKey(gridEnd) };
}

/** 月の初日と末日を ISO 8601 で返す(timestamptz カラム用)。 */
export function monthIsoRange(month: Date): { fromIso: string; toIso: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 42);
  return { fromIso: gridStart.toISOString(), toIso: gridEnd.toISOString() };
}

/** YYYY-MM-01。budgets.month の比較に使う。 */
export function toBudgetMonth(month: Date): string {
  return `${month.getFullYear()}-${pad(month.getMonth() + 1)}-01`;
}
