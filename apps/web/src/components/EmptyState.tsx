import type { ReactNode } from 'react';

import type { IconName } from './icons/Icon';
import { Icon } from './icons/Icon';

import styles from './States.module.css';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  /** 最初の一件を作る導線 */
  action?: ReactNode;
}

/** 0件表示(1e フィードバック状態)。一覧系画面で必ず実装する。 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon name={icon} size={26} />
      </span>
      <p className={styles.emptyTitle}>{title}</p>
      {description ? <p className={styles.emptyBody}>{description}</p> : null}
      {action}
    </div>
  );
}
