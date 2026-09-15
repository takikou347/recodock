import type { LucideIcon } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

import { AppError } from '@recodock/shared';

import { Modal } from './Modal';
import { TextField } from './TextField';

import { Button } from '@/components/ui/button';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  /** 名前欄のラベルと例 */
  fieldLabel: string;
  placeholder?: string;
  /** 名前欄の下に足す入力(任意) */
  children?: ReactNode;
  isSaving?: boolean;
  /** 入力された名前で作成する。例外は文言に変えて表示する */
  onSubmit: (value: string) => Promise<void>;
}

/** 名前だけを入れて 1 件つくる共通モーダル(持ち物・メモの追加)。 */
export function QuickCreateModal({
  isOpen,
  onClose,
  title,
  icon,
  fieldLabel,
  placeholder,
  children,
  isSaving = false,
  onSubmit,
}: QuickCreateModalProps) {
  const [value, setValue] = useState('');
  const [errorText, setErrorText] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      setErrorText(`${fieldLabel}を入力してください`);
      return;
    }
    setErrorText(undefined);
    try {
      await onSubmit(value.trim());
      setValue('');
      onClose();
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={icon}>
      {/* Enter だけで作れるようにフォームにする */}
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)} noValidate>
        <TextField
          label={fieldLabel}
          value={value}
          placeholder={placeholder}
          errorText={errorText}
          onChange={(event) => setValue(event.target.value)}
        />
        {children}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? '保存中…' : '保存する'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
