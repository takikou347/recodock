import type { CSSProperties } from 'react';

import type { ModuleKey } from '@recodock/shared';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/icons/Icon';
import { useToast } from '../components/Toast';
import type { WebModule } from '../modules/registry';
import { findModule, moduleRegistry } from '../modules/registry';
import { CORE_MODULE_KEY, useUserModules } from './userModules';

import styles from './ModuleManagerPage.module.css';
import layout from './pageLayout.module.css';

/** iOS のタブに載るのは上位4件。残りは「その他」に入る(01_screen_design.md 3.3)。 */
const IOS_TAB_SLOT_COUNT = 4;

function toneStyle(moduleKey: ModuleKey): CSSProperties {
  return {
    '--tone-bg': `var(--color-${moduleKey}-bg)`,
    '--tone-line': `var(--color-${moduleKey}-line)`,
    '--tone-fg': `var(--color-${moduleKey}-fg)`,
  } as CSSProperties;
}

/**
 * SC-05 モジュール管理。
 * 追加済みモジュールの並び順が Web サイドバーと iOS タブ(上位4件＋その他)に即反映される。
 */
export function ModuleManagerPage() {
  const { addedKeys, addModule, removeModule } = useUserModules();
  const { showToast } = useToast();

  const addedModules = addedKeys
    .map((key) => findModule(key))
    .filter((module): module is WebModule => module !== undefined);
  const addableModules = moduleRegistry.filter(
    (module) => !addedKeys.includes(module.definition.key),
  );

  const onAdd = (module: WebModule) => {
    addModule(module.definition.key);
    showToast({ message: `${module.definition.displayName}を追加しました` });
  };

  const onRemove = (module: WebModule) => {
    removeModule(module.definition.key);
    showToast({
      message: `${module.definition.displayName}を削除しました`,
      onUndo: () => addModule(module.definition.key),
    });
  };

  return (
    <div className={layout.page}>
      <div>
        <h1 className={layout.titleSm}>モジュール管理</h1>
        <p className={layout.subtitle}>
          追加したモジュールだけが並びます。並び順は Web サイドバーと iOS
          タブ（上位4件＋その他）に即反映。
        </p>
      </div>

      <div className={styles.groups}>
        <section className={styles.group}>
          <h2 className={layout.sectionLabel}>追加済み {addedModules.length}</h2>
          {addedModules.map((module, index) => {
            const moduleKey = module.definition.key;
            const isCore = moduleKey === CORE_MODULE_KEY;
            return (
              <Card key={moduleKey} isRow>
                <div className={styles.row} style={toneStyle(moduleKey)}>
                  <span className={styles.dragHandle} aria-hidden="true">
                    <Icon name="drag" size={15} />
                  </span>
                  <span className={styles.icon}>
                    <module.icon className="size-5" />
                  </span>
                  <div className={styles.text}>
                    <p className={styles.name}>
                      {module.definition.brandName} ／ {module.definition.displayName}
                    </p>
                    <p className={styles.desc}>{module.detail}</p>
                  </div>
                  {index < IOS_TAB_SLOT_COUNT ? (
                    <span className={styles.tabBadge}>iOSタブ {index + 1}</span>
                  ) : null}
                  {isCore ? (
                    <span className={styles.coreBadge}>コア</span>
                  ) : (
                    <Button variant="text" size="sm" onClick={() => onRemove(module)}>
                      削除
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </section>

        {addableModules.length > 0 ? (
          <section className={styles.group}>
            <h2 className={layout.sectionLabel}>追加できるモジュール</h2>
            {addableModules.map((module) => (
              <div
                key={module.definition.key}
                className={styles.addableRow}
                style={toneStyle(module.definition.key)}
              >
                <span className={styles.icon}>
                  <module.icon className="size-5" />
                </span>
                <div className={styles.text}>
                  <p className={styles.name}>{module.definition.displayName}</p>
                  <p className={styles.desc}>{module.detail}</p>
                </div>
                <Button variant="ink" size="sm" onClick={() => onAdd(module)}>
                  ＋ 追加
                </Button>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
