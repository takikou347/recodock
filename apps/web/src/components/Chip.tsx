import type { CSSProperties, ReactNode } from 'react';

import type { ModuleKey } from '@recodock/shared';

import styles from './Chip.module.css';

export interface ChipProps {
  children: ReactNode;
  /** 件数を右に添える */
  count?: number;
  isSelected?: boolean;
  /** 指定するとそのモジュールの淡色で塗る */
  tone?: ModuleKey;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/**
 * フィルタチップ(1e 選択コントロール)。
 * tone を渡すとモジュール色、渡さない選択中はインク面(「すべて」)になる。
 */
export function Chip({
  children,
  count,
  isSelected = false,
  tone,
  size = 'md',
  onClick,
}: ChipProps) {
  // 動的な値のみインラインで渡す(コーディング規約 6)。実際の色は tokens.css の変数。
  const toneStyle: CSSProperties | undefined = tone
    ? ({
        '--tone-bg': `var(--color-${tone}-bg)`,
        '--tone-fg': `var(--color-${tone}-fg)`,
      } as CSSProperties)
    : undefined;

  const variant = !isSelected ? styles.neutral : tone ? styles.toned : styles.selected;

  return (
    <button
      type="button"
      className={[styles.chip, variant, size === 'sm' ? styles.sm : ''].filter(Boolean).join(' ')}
      style={toneStyle}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      {children}
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}
