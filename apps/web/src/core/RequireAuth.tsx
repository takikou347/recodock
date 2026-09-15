import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './auth';

import { Skeleton } from '@/components/Skeleton';

export interface RequireAuthProps {
  children: ReactNode;
}

/**
 * 認証ガード(SC-01)。未ログインならログイン画面へ送り、
 * 復帰できるように元の遷移先を state に持たせる。
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // セッション復元中のプレースホルダ。実コンテンツと同じ位置に置く
    return (
      <div className="mx-auto w-full max-w-160 p-8">
        <Skeleton lineCount={3} hasBlock />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
