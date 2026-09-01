import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ModuleKey } from '@recodock/shared';

import type { IconName } from './icons/Icon';
import { Icon } from './icons/Icon';

import styles from './Fab.module.css';

export interface FabAction {
  moduleKey: ModuleKey;
  icon: IconName;
  label: string;
  onSelect: () => void;
}

export interface FabProps {
  /** 押すと開くモジュール選択メニュー(1e: FAB は記録の追加) */
  actions: readonly FabAction[];
}

/**
 * 記録追加の FAB(1e)。全画面共通でアクセント色、押すとモジュール選択メニューを開く。
 * 配置は親側の position: relative を基準にする。
 */
export function Fab({ actions }: FabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 外部システム(document のクリック・キー入力)との同期
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
    <div className={styles.anchor} ref={rootRef}>
      {isOpen ? (
        <div className={styles.menu} role="menu">
          {actions.map((action) => {
            const toneStyle: CSSProperties = {
              '--tone-bg': `var(--color-${action.moduleKey}-bg)`,
              '--tone-line': `var(--color-${action.moduleKey}-line)`,
              '--tone-fg': `var(--color-${action.moduleKey}-fg)`,
            } as CSSProperties;
            return (
              <button
                key={action.moduleKey}
                type="button"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => {
                  setIsOpen(false);
                  action.onSelect();
                }}
              >
                <span className={styles.menuIcon} style={toneStyle}>
                  <Icon name={action.icon} size={18} />
                </span>
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        className={styles.fab}
        aria-label="記録を追加"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="plus" size={28} />
      </button>
    </div>
  );
}
