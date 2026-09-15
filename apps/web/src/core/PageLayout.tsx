import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * モジュール画面の外枠。スクロールはここが持ち、FAB の配置基準にもなる。
 * 旧 `pageLayout.module.css` の置き換え(ADR-0008)。
 */
export function Page({ children, className }: PageProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  /** 見出しの右に添える件数など */
  meta?: ReactNode;
  /** 見出しの下の説明 */
  description?: string;
  /** 右端に寄せる操作 */
  actions?: ReactNode;
}

/** 画面見出し。`h1` はここだけが出す(1 画面に 1 つ)。 */
export function PageHeader({ title, meta, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="font-heading truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {meta ? <span className="text-muted-foreground shrink-0 text-sm">{meta}</span> : null}
        </div>
        {description ? <p className="text-muted-foreground mt-0.5 text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** 見出しの下に置くフィルタ・検索の行。 */
export function PageToolbar({ children, className, ...rest }: PageProps & ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...rest}>
      {children}
    </div>
  );
}
