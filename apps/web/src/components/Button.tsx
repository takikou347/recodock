import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { Button as UiButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** アプリの語彙(primary…)を shadcn/ui の variant に対応づける。 */
const VARIANT_MAP = {
  primary: 'default',
  secondary: 'outline',
  ink: 'secondary',
  text: 'ghost',
  danger: 'destructive',
} as const;

const SIZE_MAP = { sm: 'sm', md: 'default', lg: 'lg' } as const;

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 先頭に置くアイコン(lucide。ADR-0008) */
  icon?: LucideIcon;
  /** 横幅いっぱいに広げる(SP のフォーム送信など) */
  isBlock?: boolean;
  children: ReactNode;
}

/**
 * 共通ボタン。実体は shadcn/ui の Button で、色・寸法・フォーカスリングはそちらに従う。
 * 画面の移行が終わったら、このラッパーは外して `ui/button` を直接使う。
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  isBlock = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <UiButton
      type={type}
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      className={cn(isBlock && 'w-full', className)}
      {...rest}
    >
      {Icon ? <Icon /> : null}
      {children}
    </UiButton>
  );
}
