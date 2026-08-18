import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AppLayout } from './App';
import { moduleRegistry } from './modules/registry';

const queryClient = new QueryClient();

// モジュール登録(FR-02): 各モジュールが提供するルートを集約してルーターを構成する。
// コアはモジュール固有の画面を知らない。
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: moduleRegistry.flatMap((mod) => mod.routes),
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
