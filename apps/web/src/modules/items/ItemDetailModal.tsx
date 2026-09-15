import { PackageIcon } from 'lucide-react';

import type { ItemRecord } from '@recodock/shared';
import { formatAmount, formatDateValue } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

import styles from './ItemDetailModal.module.css';

export interface ItemDetailModalProps {
  isOpen: boolean;
  item: ItemRecord | undefined;
  onClose: () => void;
  onEdit: () => void;
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
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>カテゴリ</span>
          <span className={styles.rowValue}>{item.category ?? '未分類'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>購入日</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {dateLabel(item.purchasedOn)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>価格</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {item.price !== null ? formatAmount(item.price) : '未設定'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>保管場所</span>
          <span className={styles.rowValue}>{item.location ?? '未設定'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>保証期限</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {dateLabel(item.warrantyExpiresOn)}
          </span>
        </div>
        {item.memo ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>備考</span>
            <span className={styles.rowValue}>{item.memo}</span>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
