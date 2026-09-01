import { useEffect } from 'react';

import { Button } from './Button';

import styles from './Overlay.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  /** 実行ボタンの文言(例: 削除する) */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 確認ダイアログ(1e オーバーレイ規則)。
 * 取り消せない操作にのみ使う。取り消せる操作はトーストの「元に戻す」で受ける。
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.scrim} onClick={onCancel} role="presentation">
      <div
        className={[styles.modal, styles.confirm].join(' ')}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.confirmTitle}>{title}</h2>
        <p className={styles.confirmBody}>{description}</p>
        <div className={styles.confirmFooter}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
