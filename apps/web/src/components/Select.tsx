import type { ReactNode } from 'react';
import { useId } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 読み上げ用の名前。label を出すときも引き続き必須(短い名前にできる) */
  ariaLabel: string;
  /** 見える形のラベル。渡すと htmlFor で結びつける(監査 H-12) */
  label?: ReactNode;
  className?: string;
  isDisabled?: boolean;
}

/**
 * 単一選択のドロップダウン。実体は Radix の Select なので、
 * 矢印キー・Home/End・タイプアヘッド・`aria-activedescendant` が揃う(監査 H-13)。
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  label,
  className,
  isDisabled,
}: SelectProps<T>) {
  const id = useId();
  const trigger = (
    <UiSelect value={value} onValueChange={(next) => onChange(next as T)} disabled={isDisabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn('w-auto', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  );

  if (!label) return trigger;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {trigger}
    </div>
  );
}
