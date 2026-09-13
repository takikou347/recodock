import { Icon } from './Icon';

import { cn } from '@/lib/utils';

interface BrandMarkProps {
  /** 一辺の px。既定 24 */
  size?: number;
  className?: string;
}

/**
 * プロダクトのブランドマーク。差し替え候補を検討中のため(07_ui-audit.md)、
 * 参照箇所をここ 1 か所に集約しておき、決定後はこのファイルだけを変える。
 */
export function BrandMark({ size = 24, className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center rounded-lg',
        className,
      )}
      style={{ width: size * 1.6, height: size * 1.6 }}
      aria-hidden="true"
    >
      <Icon name="logo" size={size} />
    </span>
  );
}
