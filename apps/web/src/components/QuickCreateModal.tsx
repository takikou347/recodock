import type { ReactNode } from 'react';
import { useState } from 'react';

import { AppError } from '@recodock/shared';

import { Button } from './Button';
import type { IconName } from './icons/Icon';
import { Modal } from './Modal';
import { TextField } from './TextField';

export interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: IconName;
  /** 名前欄のラベルと例 */
  fieldLabel: string;
  placeholder?: string;
  /** 名前欄の下に足す入力(任意) */
  children?: ReactNode;
  isSaving?: boolean;
  /** 入力された名前で作成する。例外は文言に変えて表示する */
  onSubmit: (value: string) => Promise<void>;
}

/**
 * 名前だけを入れて 1 件つくる共通モーダル(持ち物・メモの追加)。
 * PC は中央モーダル、SP はボトムシート(1e オーバーレイ規則)。
 */
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

  const submit = async () => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={() => void submit()} disabled={isSaving}>
            {isSaving ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label={fieldLabel}
        value={value}
        placeholder={placeholder}
        errorText={errorText}
        onChange={(event) => setValue(event.target.value)}
      />
      {children}
    </Modal>
  );
}
