import styles from './Toggle.module.css';

export interface ToggleProps {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
  /** トグル右のラベル。視覚ラベルが無い場合は ariaLabel を渡す */
  label?: string;
  ariaLabel?: string;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
}

/** トグルスイッチ(1e 選択コントロール)。ON はモジュール淡色。 */
export function Toggle({
  isOn,
  onChange,
  label,
  ariaLabel,
  isDisabled = false,
  size = 'md',
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label ? undefined : ariaLabel}
      disabled={isDisabled}
      onClick={() => onChange(!isOn)}
      className={[styles.root, isOn ? styles.on : '', size === 'sm' ? styles.sm : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </button>
  );
}
