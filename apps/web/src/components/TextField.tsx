import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /** ラベル右端の補助リンク(例:「お忘れですか？」) */
  labelAside?: ReactNode;
  /** 入力欄の下に出す説明 */
  helperText?: string;
  /** 設定するとエラー表示になる */
  errorText?: string;
  /** 金額・日付など等幅で表示する */
  isNumeric?: boolean;
}

/**
 * ラベル・補助文・エラーをひとまとめにした単一行入力。
 * `htmlFor` / `aria-describedby` / `aria-invalid` をここで必ず結びつけるため、
 * 画面側で label を自前に組まない(監査 H-12)。
 */
export function TextField({
  label,
  labelAside,
  helperText,
  errorText,
  isNumeric = false,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = errorText
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined;

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>{label}</Label>
        {labelAside ? <span className="text-muted-foreground text-sm">{labelAside}</span> : null}
      </div>
      <Input
        id={inputId}
        className={cn(isNumeric && 'font-mono tabular-nums')}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedById}
        {...rest}
      />
      {errorText ? (
        <p id={`${inputId}-error`} className="text-destructive text-xs">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
