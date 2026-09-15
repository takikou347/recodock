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
  ariaLabel: string;
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
  className,
  isDisabled,
}: SelectProps<T>) {
  return (
    <UiSelect value={value} onValueChange={(next) => onChange(next as T)} disabled={isDisabled}>
      <SelectTrigger aria-label={ariaLabel} className={cn('w-auto', className)}>
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
}
