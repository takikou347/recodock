import { Icon } from './icons/Icon';

import styles from './Checkbox.module.css';

export interface CheckboxProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  label: string;
  /** ラジオ(単一選択)として描画する */
  isRadio?: boolean;
}

/** チェックボックス／ラジオ(1e 選択コントロール)。選択中はモジュールのアクセント色。 */
export function Checkbox({ isChecked, onChange, label, isRadio = false }: CheckboxProps) {
  return (
    <button
      type="button"
      role={isRadio ? 'radio' : 'checkbox'}
      aria-checked={isChecked}
      onClick={() => onChange(!isChecked)}
      className={[styles.root, isChecked ? styles.checked : ''].filter(Boolean).join(' ')}
    >
      <span className={[styles.box, isRadio ? styles.radio : ''].filter(Boolean).join(' ')}>
        {isChecked ? (
          isRadio ? (
            <span className={styles.dot} />
          ) : (
            <Icon name="check" size={14} />
          )
        ) : null}
      </span>
      {label}
    </button>
  );
}
