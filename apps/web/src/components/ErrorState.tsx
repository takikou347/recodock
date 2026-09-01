import { Button } from './Button';

import styles from './States.module.css';

export interface ErrorStateProps {
  title: string;
  description: string;
  /** 再試行できる場合に渡す */
  onRetry?: () => void;
}

/** エラー表示(1e フィードバック状態)。記録は端末に残る前提で復帰導線を出す。 */
export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.error} role="alert">
      <span className={styles.errorIcon} aria-hidden="true">
        !
      </span>
      <div className={styles.errorText}>
        <p className={styles.errorTitle}>{title}</p>
        <p className={styles.errorBody}>{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          再試行
        </Button>
      ) : null}
    </div>
  );
}
