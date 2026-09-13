import {
  BookOpenIcon,
  CalendarDaysIcon,
  type LucideIcon,
  MapPinIcon,
  PackageIcon,
  StickyNoteIcon,
  WalletIcon,
} from 'lucide-react';
import type { RouteObject } from 'react-router-dom';

import type { ModuleDefinition, ModuleKey } from '@recodock/shared';

import { CalendarHomePage } from './calendar/CalendarHomePage';
import { DayEntriesPage } from './calendar/DayEntriesPage';
import { DiaryEditorPage } from './diary/DiaryEditorPage';
import { DiaryListPage } from './diary/DiaryListPage';
import { ItemsListPage } from './items/ItemsListPage';
import { MapPage } from './map/MapPage';
import { AccountsPage } from './money/AccountsPage';
import { BudgetsPage } from './money/BudgetsPage';
import { CategoriesPage } from './money/CategoriesPage';
import { MoneyHomePage } from './money/MoneyHomePage';
import { NoteEditorPage } from './notes/NoteEditorPage';
import { NotesListPage } from './notes/NotesListPage';

/** Web 側のモジュール登録情報(01_screen_design.md 3.4)。ルート定義を各モジュールが所有する */
export interface WebModule {
  definition: ModuleDefinition;
  /** サイドバーのリンク先 */
  basePath: string;
  /** サイドバー・ランチャー・管理画面で使うアイコン(lucide。ADR-0008) */
  icon: LucideIcon;
  /** モジュールランチャー(SC-08)・管理(SC-05)に出す説明 */
  description: string;
  /** SC-05 の追加済みリストに出す詳細 */
  detail: string;
  /**
   * モジュール内ナビ(例: 家計簿の サマリ／口座・残高…)。
   * アクティブなときだけサイドバーに出る。コアはここを素通しで描画し、中身を知らない。
   */
  secondaryNav?: readonly { label: string; path: string }[];
  routes: RouteObject[];
}

/**
 * モジュール登録(FR-02)。
 * 追加はこの配列への 1 エントリ追加だけで完結し、コア(main.tsx / App.tsx)は変更しない。
 * badgeColor は iOS(React Native)と共有するため実値を持つ。
 */
export const moduleRegistry: WebModule[] = [
  {
    definition: {
      key: 'calendar',
      displayName: 'カレンダー',
      brandName: 'Reco Calendar',
      badgeColor: '#4e7fb5',
    },
    basePath: '/',
    icon: CalendarDaysIcon,
    description: '予定と繰り返し',
    detail: '予定・繰り返し・リマインド（コア／削除不可）',
    routes: [
      { index: true, element: <CalendarHomePage /> },
      { path: 'calendar/days/:date', element: <DayEntriesPage /> },
    ],
  },
  {
    definition: {
      key: 'money',
      displayName: '家計簿',
      brandName: 'Reco Money',
      badgeColor: '#3f8c68',
    },
    basePath: '/money',
    icon: WalletIcon,
    description: '収支・口座・予算',
    detail: '収支・口座・予算',
    secondaryNav: [
      { label: 'サマリ・取引一覧', path: '/money' },
      { label: '口座・残高', path: '/money/accounts' },
      { label: 'カテゴリ管理', path: '/money/categories' },
      { label: '予算設定', path: '/money/budgets' },
    ],
    routes: [
      { path: 'money', element: <MoneyHomePage /> },
      { path: 'money/accounts', element: <AccountsPage /> },
      { path: 'money/categories', element: <CategoriesPage /> },
      { path: 'money/budgets', element: <BudgetsPage /> },
    ],
  },
  {
    definition: {
      key: 'diary',
      displayName: '日記',
      brandName: 'Reco Diary',
      badgeColor: '#c86b4e',
    },
    basePath: '/diary',
    icon: BookOpenIcon,
    description: '本文・写真・気分',
    detail: '本文・気分タグ・写真',
    routes: [
      { path: 'diary', element: <DiaryListPage /> },
      { path: 'diary/:diaryId', element: <DiaryListPage /> },
      { path: 'diary/:diaryId/edit', element: <DiaryEditorPage /> },
    ],
  },
  {
    definition: {
      key: 'items',
      displayName: '持ち物',
      brandName: 'Reco Items',
      badgeColor: '#7b5fb8',
    },
    basePath: '/items',
    icon: PackageIcon,
    description: '持ち物と保証期限',
    detail: '持ち物・保証期限・保管場所',
    routes: [{ path: 'items', element: <ItemsListPage /> }],
  },
  {
    definition: {
      key: 'notes',
      displayName: 'メモ',
      brandName: 'Reco Notes',
      badgeColor: '#a8862b',
    },
    basePath: '/notes',
    icon: StickyNoteIcon,
    description: 'Markdown メモ',
    detail: 'Markdown・ピン留め',
    routes: [
      { path: 'notes', element: <NotesListPage /> },
      { path: 'notes/:noteId', element: <NoteEditorPage /> },
    ],
  },
  {
    definition: {
      key: 'map',
      displayName: '地図',
      brandName: 'Reco Map',
      badgeColor: '#2e858e',
    },
    basePath: '/map',
    icon: MapPinIcon,
    description: 'スポットと訪問',
    detail: 'スポット・訪問記録',
    routes: [{ path: 'map', element: <MapPage /> }],
  },
];

/** モジュールキーから登録情報を引く。 */
export function findModule(moduleKey: ModuleKey): WebModule | undefined {
  return moduleRegistry.find((module) => module.definition.key === moduleKey);
}
