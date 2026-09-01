import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppLayout } from '../App';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../core/auth';
import { LoginPage } from '../core/LoginPage';
import { ModuleManagerPage } from '../core/ModuleManagerPage';
import { PasswordResetPage } from '../core/PasswordResetPage';
import { RequireAuth } from '../core/RequireAuth';
import { SearchPage } from '../core/SearchPage';
import { SettingsPage } from '../core/SettingsPage';
import { SignUpPage } from '../core/SignUpPage';
import { UserModulesProvider } from '../core/userModules';
import { moduleRegistry, type RouteHandle } from '../modules/registry';

/** テスト中のリトライ・キャッシュを切って、1 回の呼び出しがそのまま画面に出るようにする。 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderAppOptions {
  /** 最初に表示するパス */
  route?: string;
}

/**
 * 本番と同じルーター構成でアプリを描画する。
 * データ取得はリポジトリ関数の境界でモックする前提(コーディング規約 8)。
 */
export function renderApp({ route = '/' }: RenderAppOptions = {}): RenderResult {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/reset-password', element: <PasswordResetPage /> },
      {
        path: '/',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          ...moduleRegistry.flatMap((mod) => mod.routes),
          {
            path: 'search',
            element: <SearchPage />,
            handle: { shellMode: 'rail' } satisfies RouteHandle,
          },
          {
            path: 'modules',
            element: <ModuleManagerPage />,
            handle: { shellMode: 'rail' } satisfies RouteHandle,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
            handle: { shellMode: 'rail' } satisfies RouteHandle,
          },
        ],
      },
    ],
    { initialEntries: [route] },
  );

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <UserModulesProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </UserModulesProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

/** ルーターを使わない小さな部品を、プロバイダだけ被せて描画する。 */
export function renderWithProviders(ui: ReactNode): RenderResult {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
