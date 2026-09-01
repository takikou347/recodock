import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import type { IconName } from './icons/Icon';
import { Icon } from './icons/Icon';

import styles from './Overlay.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** 見出し左のモジュールアイコン */
  icon?: IconName;
  /** 操作ボタン。省略すると footer を描画しない */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * PC = 画面中央モーダル / SP = ボトムシート(1e オーバーレイ規則)。
 * ESC とスクリムのクリックで閉じ、開いている間は背面のスクロールを止める。
 */
export function Modal({ isOpen, onClose, title, icon, footer, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 外部システム(document のキー入力・スクロール)との同期(コーディング規約 7)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.scrim} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <span className={styles.grabber} />
        <div className={styles.header}>
          {icon ? (
            <span className={styles.badge}>
              <Icon name={icon} size={21} />
            </span>
          ) : null}
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="閉じる">
            <Icon name="close" size={17} />
          </button>
        </div>
        {children}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
