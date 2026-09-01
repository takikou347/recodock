import { useEffect, useRef, useState } from 'react';

import { Icon } from './icons/Icon';

import styles from './Select.module.css';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** ドロップダウン(1e 選択コントロール)。繰り返し・リマインドなどの単一選択に使う。 */
export function Select<T extends string>({ options, value, onChange, ariaLabel }: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={[styles.trigger, isOpen ? styles.open : ''].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {selected?.label}
        <span className={styles.caret}>
          <Icon name="chevronDown" size={15} />
        </span>
      </button>
      {isOpen ? (
        <ul className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={[styles.option, option.value === value ? styles.optionSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
                {option.value === value ? (
                  <span className={styles.optionCheck}>
                    <Icon name="check" size={15} />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
