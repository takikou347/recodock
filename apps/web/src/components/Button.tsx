import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { IconName } from './icons/Icon';
import { Icon } from './icons/Icon';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 先頭に置くアイコン */
  icon?: IconName;
  /** 横幅いっぱいに広げる(SP のフォーム送信など) */
  isBlock?: boolean;
  children: ReactNode;
}

/**
 * 共通ボタン(1e ボタン状態マトリクス)。
 * プライマリの色は配下のモジュールテーマ(--color-module-solid)に追従する。
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  isBlock = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    isBlock ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 20 : 16} /> : null}
      {children}
    </button>
  );
}
