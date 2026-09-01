import type { CSSProperties, ReactNode } from 'react';

import type { ModuleKey } from '@recodock/shared';

import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  /** 一覧の行として使う小さめの寸法 */
  isRow?: boolean;
  /** 中身が自前で余白を持つ場合(リスト・テーブル) */
  isFlush?: boolean;
  /** モジュール淡色で塗る */
  tone?: ModuleKey;
  /** クリックできるカードにする */
  onClick?: () => void;
  className?: string;
}

/** 共通カード(1a 共通部品: 実線 1.5px ＋ オフセット影)。 */
export function Card({ children, isRow, isFlush, tone, onClick, className }: CardProps) {
  const toneStyle: CSSProperties | undefined = tone
    ? ({
        '--tone-bg': `var(--color-${tone}-bg)`,
        '--tone-line': `var(--color-${tone}-line)`,
      } as CSSProperties)
    : undefined;

  const classes = [
    styles.card,
    isRow ? styles.row : '',
    isFlush ? styles.flush : '',
    tone ? styles.toned : '',
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button type="button" className={classes} style={toneStyle} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <div className={classes} style={toneStyle}>
      {children}
    </div>
  );
}
