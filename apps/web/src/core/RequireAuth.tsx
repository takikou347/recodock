import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Skeleton } from '../components/Skeleton';
import { useAuth } from './auth';

import styles from './RequireAuth.module.css';

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
    return (
      <div className={styles.loading}>
        <Skeleton lineCount={3} hasBlock />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
