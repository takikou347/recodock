import { CheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

/** 4秒で自動消滅 */
const TOAST_DURATION_MS = 4000;

interface Toast {
  id: number;
  message: string;
  /** 破壊的操作には必ず「元に戻す」を付ける */
  onUndo?: () => void;
}

export interface ShowToastOptions {
  message: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

/** トーストの表示を担うプロバイダ。アプリのルートに一度だけ置く。 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, onUndo }: ShowToastOptions) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, onUndo }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id } = toast;
  // 外部システム(タイマー)との同期
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div className="bg-primary text-primary-foreground pointer-events-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-lg">
      <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>{toast.message}</span>
      {toast.onUndo ? (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-primary-foreground/15 hover:text-primary-foreground -mr-1 ml-1 h-6 underline underline-offset-2"
          onClick={() => {
            toast.onUndo?.();
            onDismiss(id);
          }}
        >
          元に戻す
        </Button>
      ) : null}
    </div>
  );
}

/** トーストを出すためのフック。ToastProvider の内側でのみ使える。 */
export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast は ToastProvider の内側で使ってください');
  return context;
}
