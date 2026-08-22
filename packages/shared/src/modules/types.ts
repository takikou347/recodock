// モジュール登録インターフェース(FR-02)。
// 各モジュールはこの定義を実装してコアに登録し、コアはモジュール固有の知識を持たない。
// 詳細: docs/recodock/02_design/01_screen_design.md 3.4(develop-docs リポジトリ)

export const MODULE_KEYS = ['calendar', 'money', 'diary', 'items', 'notes', 'map'] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleDefinition {
  /** user_modules.module_key と一致させる */
  key: ModuleKey;
  /** UI 上の日本語表示名(例: 家計簿) */
  displayName: string;
  /** モジュール名(Reco + 英単語1語。例: Reco Money) */
  brandName: string;
  /** カレンダー集約バッジ(CAL-04)の色。calendar_entries.module との対応 */
  badgeColor: string;
}
