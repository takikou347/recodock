import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface CardProps {
  children: ReactNode;
  /** 一覧の行として使う小さめの寸法 */
  isRow?: boolean;
  /** 中身が自前で余白を持つ場合(リスト・テーブル) */
  isFlush?: boolean;
  /** クリックできるカードにする */
  onClick?: () => void;
  className?: string;
}

/**
 * 共通カード。モジュール別の塗り分け(旧 `tone`)は ADR-0008 で廃止した。
 * 画面の移行が終わったら、このラッパーは外して `ui/card` を直接使う。
 */
export function Card({ children, isRow, isFlush, onClick, className }: CardProps) {
  const classes = cn(
    'bg-card text-card-foreground rounded-xl border',
    isFlush ? 'p-0' : isRow ? 'p-3' : 'p-4',
    onClick &&
      'hover:bg-muted/50 focus-visible:ring-ring/50 w-full text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
    className,
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={classes}>{children}</div>;
}
