import type { RouteObject } from 'react-router-dom';

import type { ModuleDefinition } from '@recodock/shared';

import { CalendarHomePage } from './calendar/CalendarHomePage';

/** Web 側のモジュール登録情報(01_screen_design.md 3.4)。ルート定義を各モジュールが所有する */
export interface WebModule {
  definition: ModuleDefinition;
  /** サイドバーのリンク先 */
  basePath: string;
  routes: RouteObject[];
}

// カレンダーはホーム(SC-04 = CAL-10)。他モジュールは実装時にここへ追加していく。
// 追加時にコア(main.tsx / App.tsx)の変更が不要であることを保つ(FR-02)。
export const moduleRegistry: WebModule[] = [
  {
    definition: {
      key: 'calendar',
      displayName: 'カレンダー',
      brandName: 'Reco Calendar',
      badgeColor: '#2563eb',
    },
    basePath: '/',
    routes: [{ index: true, element: <CalendarHomePage /> }],
  },
];
