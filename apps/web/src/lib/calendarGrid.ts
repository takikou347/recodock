/** カレンダーの 1 セル(月グリッドは前後月を含む 42 セル固定)。 */
export interface CalendarGridCell {
  date: Date;
  /** 表示中の月以外(前後月)のセル */
  isOutside: boolean;
  isToday: boolean;
}

const GRID_CELL_COUNT = 42;

/**
 * 月表示の 42 セルを組み立てる(CAL-10)。
 * 週の始まりは日曜。前月の残りと翌月の頭で 6 週ぶんを必ず埋める。
 */
export function buildMonthGrid(month: Date, today: Date): CalendarGridCell[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: GRID_CELL_COUNT }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    return {
      date,
      isOutside: date.getMonth() !== month.getMonth(),
      isToday: isSameDay(date, today),
    };
  });
}

/** 同じ日か(年月日で比較) */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 日付を YYYY-MM-DD のキーにする(集約データの引き当て用) */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 月を前後に動かす */
export function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}
