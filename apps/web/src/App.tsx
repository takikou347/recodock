import { NavLink, Outlet } from 'react-router-dom';

import { moduleRegistry } from './modules/registry';

/**
 * 共通レイアウト(docs/recodock/02_design/01_screen_design.md 3.2)。
 * 左サイドバーにモジュール切替を置き、ホームはカレンダー(SC-04)。
 * TODO: 認証ガード(SC-01)と user_modules による有効モジュールのフィルタ(CORE-02)を実装する。
 */
export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, borderRight: '1px solid #ddd', padding: 16 }}>
        <h1 style={{ fontSize: 18 }}>Recodock</h1>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {moduleRegistry.map((mod) => (
            <li key={mod.definition.key}>
              <NavLink to={mod.basePath}>{mod.definition.displayName}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
