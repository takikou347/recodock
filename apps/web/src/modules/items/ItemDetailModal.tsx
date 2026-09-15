import { PackageIcon } from 'lucide-react';

import type { ItemRecord } from '@recodock/shared';
import { formatAmount, formatDateValue } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';

export interface ItemDetailModalProps {
  isOpen: boolean;
  item: ItemRecord | undefined;
  onClose: () => void;
  onEdit: () => void;
}

interface DetailRowProps {
  label: string;
  value: string;
  /** 日付・金額を等幅で揃える */
  isNumeric?: boolean;
}

function DetailRow({ label, value, isNumeric = false }: DetailRowProps) {
  return (
    <div className="flex items-baseline gap-3 border-b pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground w-24 shrink-0 text-sm">{label}</dt>
      <dd
        className={cn(
          'min-w-0 flex-1 text-sm font-medium wrap-anywhere',
          isNumeric && 'font-mono tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function dateLabel(value: string | null): string {
  return value ? formatDateValue(new Date(`${value}T00:00:00`)) : '未設定';
}

/** ITM-51 持ち物詳細。購入情報・保管場所・保証期限を確認して編集へ分岐する。 */
export function ItemDetailModal({ isOpen, item, onClose, onEdit }: ItemDetailModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      icon={PackageIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
          <Button variant="primary" onClick={onEdit}>
            編集
          </Button>
        </>
      }
    >
      <dl className="grid gap-3">
        <DetailRow label="カテゴリ" value={item.category ?? '未分類'} />
        <DetailRow label="購入日" value={dateLabel(item.purchasedOn)} isNumeric />
        <DetailRow
          label="価格"
          value={item.price !== null ? formatAmount(item.price) : '未設定'}
          isNumeric
        />
        <DetailRow label="保管場所" value={item.location ?? '未設定'} />
        <DetailRow label="保証期限" value={dateLabel(item.warrantyExpiresOn)} isNumeric />
        {item.memo ? <DetailRow label="備考" value={item.memo} /> : null}
      </dl>
    </Modal>
  );
}
