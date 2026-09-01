import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AppLayout } from './App';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './core/auth';
import { LoginPage } from './core/LoginPage';
import { ModuleManagerPage } from './core/ModuleManagerPage';
import { RequireAuth } from './core/RequireAuth';
import { SearchPage } from './core/SearchPage';
import { SettingsPage } from './core/SettingsPage';
import { UserModulesProvider } from './core/userModules';
import type { RouteHandle } from './modules/registry';
import { moduleRegistry } from './modules/registry';

import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    // 書き込み mutation はリトライしない(二重登録防止。コーディング規約 5)
    mutations: { retry: false },
  },
});

// モジュール登録(FR-02): 各モジュールが提供するルートを集約してルーターを構成する。
// コアはモジュール固有の画面を知らない。
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
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
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root が見つかりません');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserModulesProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </UserModulesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
