import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { Icon } from '../components/icons/Icon';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { moduleRegistry } from '../modules/registry';
import { useUserModules } from './userModules';

import styles from './ModuleLauncher.module.css';

export interface ModuleLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SC-08 モジュールランチャー(Google 風の 9 ドットから開く)。
 * 使うモジュールだけを自分で追加する。追加した順にサイドバー／iOS タブへ並ぶ。
 */
export function ModuleLauncher({ isOpen, onClose }: ModuleLauncherProps) {
  const navigate = useNavigate();
  const { addedKeys, addModule } = useUserModules();
  const { showToast } = useToast();

  const onSelect = (
    moduleKey: ModuleKey,
    displayName: string,
    isAdded: boolean,
    basePath: string,
  ) => {
    if (isAdded) {
      onClose();
      navigate(basePath);
      return;
    }
    addModule(moduleKey);
    showToast({ message: `${displayName}を追加しました` });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="モジュール">
      <div className={styles.header}>
        <span className={styles.hint}>使うものだけ追加できます</span>
      </div>

      <div className={styles.grid}>
        {moduleRegistry.map((module) => {
          const moduleKey = module.definition.key;
          const isAdded = addedKeys.includes(moduleKey);
          const toneStyle: CSSProperties = {
            '--tone-bg': `var(--color-${moduleKey}-bg)`,
            '--tone-line': `var(--color-${moduleKey}-line)`,
            '--tone-fg': `var(--color-${moduleKey}-fg)`,
          } as CSSProperties;

          return (
            <button
              key={moduleKey}
              type="button"
              className={styles.tile}
              style={toneStyle}
              onClick={() =>
                onSelect(moduleKey, module.definition.displayName, isAdded, module.basePath)
              }
            >
              <span className={styles.tileIcon}>
                <Icon name={module.icon} size={29} />
              </span>
              <span className={styles.tileName}>{module.definition.displayName}</span>
              <span className={styles.tileDesc}>{module.description}</span>
              <span
                className={[styles.action, isAdded ? styles.actionAdded : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {isAdded ? '追加済み' : '＋ 追加'}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <span>追加した順にサイドバー／iOSタブへ並びます</span>
        <button
          type="button"
          className={styles.footerLink}
          onClick={() => {
            onClose();
            navigate('/modules');
          }}
        >
          モジュール管理を開く ›
        </button>
      </div>
    </Modal>
  );
}
