import type { ReactNode } from 'react';

import { BrandMark } from '@/components/icons/BrandMark';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';

interface AuthLayoutProps {
  /** 画面見出し。h1 として読み上げられる */
  title: string;
  description: string;
  children: ReactNode;
  /** カード下部の導線(ログイン⇄新規登録など) */
  footer?: ReactNode;
}

/** SC-01〜03 の共通レイアウト。中央 1 カラムのカードに揃える。 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <BrandMark className="mx-auto mb-3 size-10 rounded-xl" />
          <h1 className="font-heading text-xl leading-snug font-medium">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? (
          <CardFooter className="text-muted-foreground justify-center text-sm">{footer}</CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
