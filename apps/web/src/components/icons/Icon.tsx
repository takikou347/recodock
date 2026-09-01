import type { CSSProperties } from 'react';

import { ICON_PATHS } from './iconPaths';

/** 利用できるアイコン名。デザイン(Recodock Screens.dc.html)の SVG シンボルと 1:1 で対応する。 */
export type IconName = keyof typeof ICON_PATHS;

export interface IconProps {
  name: IconName;
  /** 一辺の px。既定 20px */
  size?: number;
  /** 装飾でないアイコンに付ける代替テキスト。省略時は aria-hidden */
  label?: string;
  className?: string;
}

/**
 * ラインアイコン(1.6px / currentColor)。
 * サービスマークと6モジュールのアイコンはデザイン側で新規作成したもの。
 */
export function Icon({ name, size = 20, label, className }: IconProps) {
  const style: CSSProperties = { width: size, height: size, display: 'block', flexShrink: 0 };
  return (
    <svg
      viewBox="0 0 24 24"
      style={style}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
