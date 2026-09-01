import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

import styles from './TextField.module.css';

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

/** 共通の単一行入力(1e 入力欄)。 */
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
    <div
      className={[styles.field, errorText ? styles.hasError : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {labelAside ? <span className={styles.labelAside}>{labelAside}</span> : null}
      </div>
      <input
        id={inputId}
        className={[styles.input, isNumeric ? styles.numeric : ''].filter(Boolean).join(' ')}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedById}
        {...rest}
      />
      {errorText ? (
        <span id={`${inputId}-error`} className={styles.error}>
          {errorText}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className={styles.helper}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
