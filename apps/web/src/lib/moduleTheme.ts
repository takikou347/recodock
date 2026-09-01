import type { ModuleKey } from '@recodock/shared';

import styles from '../styles/moduleTheme.module.css';

/**
 * モジュールキーからテーマクラス名を返す。
 * 付与した要素の配下では --color-module-* がそのモジュールの配色になる。
 * 色そのものは tokens.css / moduleTheme.module.css にあり、TS 側は色を持たない(コーディング規約 6)。
 */
export function moduleThemeClass(moduleKey: ModuleKey): string {
  return styles[moduleKey] ?? '';
}
