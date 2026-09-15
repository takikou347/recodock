import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** スクリーンリーダー向けのグループ名(例: 表示単位) */
  ariaLabel: string;
}

/**
 * 排他選択のセグメント(月／週／日 など)。実体は Radix の ToggleGroup で、
 * 矢印キー移動とロービングタブインデックスが付く(監査 H-19)。
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={value}
      // 選択中をもう一度押すと空文字が来る。排他選択なので握りつぶす
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
