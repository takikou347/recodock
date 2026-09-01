import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** SP / iOS 幅で使う詰めた寸法 */
  isCompact?: boolean;
  /** スクリーンリーダー向けのグループ名(例: 表示単位) */
  ariaLabel: string;
}

/** セグメント切替(1e 選択コントロール)。月／週／日など排他選択に使う。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  isCompact = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={[styles.root, isCompact ? styles.compact : ''].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={[styles.segment, option.value === value ? styles.selected : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
