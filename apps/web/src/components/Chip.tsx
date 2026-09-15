import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ChipProps {
  children: ReactNode;
  /** 件数を右に添える */
  count?: number;
  isSelected?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/**
 * フィルタチップ。押すと絞り込みが切り替わるので `aria-pressed` を持つ。
 * モジュール別の塗り分け(旧 `tone`)は ADR-0008 で廃止した。
 */
export function Chip({ children, count, isSelected = false, size = 'md', onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
        size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-7 px-3 text-sm',
        isSelected
          ? 'bg-primary text-primary-foreground border-transparent'
          : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      {count !== undefined ? (
        <span className={cn('tabular-nums', isSelected ? 'opacity-80' : 'text-muted-foreground')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
