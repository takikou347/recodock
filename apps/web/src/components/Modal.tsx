import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** 見出しの下に出す補足 */
  description?: string;
  /** 見出し左のアイコン(lucide) */
  icon?: LucideIcon;
  /** 操作ボタン。省略すると footer を描画しない */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * 共通モーダル。実体は Radix の Dialog なので、フォーカストラップ・ESC・
 * スクロールロック・`aria-modal` が揃う(監査 H-14)。
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  footer,
  children,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex min-w-0 items-center gap-2">
            {Icon ? <Icon className="text-muted-foreground size-4 shrink-0" /> : null}
            <span className="truncate">{title}</span>
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
