import type { TransactionRecord } from '@recodock/shared';

import type { Transaction } from '@/modules/money/useMoneySummary';

const KIND_LABELS: Readonly<Record<TransactionRecord['kind'], string>> = {
  income: '収入',
  expense: '支出',
  transfer: '振替',
};

const HEADER = ['日付', '種別', '口座', 'カテゴリ', 'メモ', '金額'] as const;

/** UTF-8 BOM。ソースに直接書くと不可視の制御文字になるのでコードポイントから作る。 */
const BOM = String.fromCodePoint(0xfeff);

/** RFC 4180: 区切り・引用符・改行を含む値は引用符で囲み、内側の引用符は 2 つにする。 */
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/**
 * 表示中の取引一覧を CSV 本文にする(MON-21 の書き出し)。
 * 日付・金額は整形済みの表示文字列ではなく保存値をそのまま出す。表計算ソフト側で
 * 日付・数値として扱えるようにするため。符号を持たせない代わりに種別列で向きが分かる。
 */
export function buildTransactionsCsv(transactions: readonly Transaction[]): string {
  const rows = transactions.map((transaction) => [
    transaction.raw.occurredOn,
    KIND_LABELS[transaction.raw.kind],
    transaction.account,
    transaction.raw.kind === 'transfer' ? '' : transaction.category,
    transaction.memo,
    String(transaction.raw.amount),
  ]);
  return [HEADER, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * CSV をその場でダウンロードさせる。
 * 書き出し用のエンドポイントを持たないので、ブラウザだけで完結させる。
 */
export function downloadCsv(fileName: string, csv: string): void {
  // BOM が無いと Excel が Shift_JIS と解釈して日本語が壊れる
  const blob = new Blob([`${BOM}${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  // Firefox は DOM に繋がっていない要素のクリックを無視する
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
