import { TriangleAlertIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title: string;
  description: string;
  /** 再試行できる場合に渡す */
  onRetry?: () => void;
}

/** エラー表示。読み込みに失敗した領域の代わりに出す。 */
export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            再試行
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
