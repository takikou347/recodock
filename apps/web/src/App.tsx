import { Outlet } from 'react-router-dom';

import { AppShell } from './core/AppShell';

/**
 * 共通レイアウト(01_screen_design.md 3.2)。
 * シェル(サイドバー／アイコンレール／SP ドロワー)はコアが持ち、
 * モジュール固有の分岐は書かない(FR-02)。
 * TODO: 認証ガード(SC-01)を追加する。
 */
export function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
