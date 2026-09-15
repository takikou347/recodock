import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  TagsIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import type { CategoryRecord } from '@recodock/shared';
import { AppError } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { Button as UiButton } from '@/components/ui/button';
import { useAuth } from '@/core/auth';
import { Page, PageHeader } from '@/core/PageLayout';
import { useCategoryActions, useCategoryGroups } from '@/modules/money/useCategories';

const KIND_OPTIONS = [
  { value: 'expense', label: '支出用' },
  { value: 'income', label: '収入用' },
] as const;

/**
 * MON-25 カテゴリ管理。プリセット + ユーザー定義の追加・名称変更・並び替え(MON-03)。
 * プリセットは帳簿作成時に行として複製されているため、同じ操作で扱える。
 */
export function CategoriesPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { expenseCategories, incomeCategories, isLoading, isError, refetch } = useCategoryGroups();
  const { addCategory, rename, move, remove } = useCategoryActions(user?.id);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<'expense' | 'income'>('expense');
  const [errorText, setErrorText] = useState<string>();
  const [renameTarget, setRenameTarget] = useState<CategoryRecord>();
  const [removeTarget, setRemoveTarget] = useState<CategoryRecord>();

  const onAdd = async () => {
    if (!newName.trim()) {
      setErrorText('カテゴリ名を入力してください');
      return;
    }
    setErrorText(undefined);
    try {
      await addCategory(newName.trim(), newKind);
      setNewName('');
      showToast({ message: 'カテゴリを追加しました' });
    } catch (error) {
      setErrorText(error instanceof AppError ? error.message : '追加に失敗しました');
    }
  };

  const onRename = async (name: string) => {
    if (!renameTarget) return;
    await rename(renameTarget.id, name);
    setRenameTarget(undefined);
    showToast({ message: 'カテゴリ名を変更しました' });
  };

  const onRemove = async () => {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(undefined);
    try {
      await remove(target.id);
      showToast({ message: `${target.name}を削除しました` });
    } catch (error) {
      showToast({
        message:
          error instanceof AppError && error.code === 'validation'
            ? '取引で使われているため削除できません'
            : '削除に失敗しました',
      });
    }
  };

  return (
    <Page>
      <PageHeader title="カテゴリ管理" />

      {isError ? (
        <ErrorState
          title="カテゴリを読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
          onRetry={refetch}
        />
      ) : isLoading ? (
        <Skeleton lineCount={5} />
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <TextField
                  label="新しいカテゴリ"
                  value={newName}
                  placeholder="サブスク"
                  errorText={errorText}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </div>
              <SegmentedControl
                options={KIND_OPTIONS}
                value={newKind}
                onChange={setNewKind}
                ariaLabel="カテゴリの種類"
              />
              <Button variant="primary" icon={PlusIcon} onClick={() => void onAdd()}>
                追加
              </Button>
            </div>
          </Card>

          <CategoryGroup
            title={`支出カテゴリ ${expenseCategories.length}`}
            categories={expenseCategories}
            onRename={setRenameTarget}
            onRemove={setRemoveTarget}
            onMove={move}
          />
          <CategoryGroup
            title={`収入カテゴリ ${incomeCategories.length}`}
            categories={incomeCategories}
            onRename={setRenameTarget}
            onRemove={setRemoveTarget}
            onMove={move}
          />
        </>
      )}

      <CategoryRenameModal
        category={renameTarget}
        onSubmit={(name) => void onRename(name)}
        onClose={() => setRenameTarget(undefined)}
      />
      <ConfirmDialog
        isOpen={removeTarget !== undefined}
        title={`${removeTarget?.name ?? ''}を削除しますか`}
        description="取引で使われているカテゴリは削除できません。削除すると元に戻せません。"
        confirmLabel="削除する"
        onConfirm={() => void onRemove()}
        onCancel={() => setRemoveTarget(undefined)}
      />
    </Page>
  );
}

interface CategoryGroupProps {
  title: string;
  categories: readonly CategoryRecord[];
  onRename: (category: CategoryRecord) => void;
  onRemove: (category: CategoryRecord) => void;
  onMove: (category: CategoryRecord, direction: -1 | 1) => Promise<void>;
}

function CategoryGroup({ title, categories, onRename, onRemove, onMove }: CategoryGroupProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
      {categories.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="カテゴリがありません"
          description="上の欄から追加できます"
        />
      ) : (
        <Card isFlush>
          <ul>
            {categories.map((category, index) => (
              <li
                key={category.id}
                className="flex min-h-13 items-center gap-3 border-b px-4 py-2 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                <span className="flex items-center gap-1">
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${category.name}を上へ`}
                    disabled={index === 0}
                    onClick={() => void onMove(category, -1)}
                  >
                    <ChevronUpIcon />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${category.name}を下へ`}
                    disabled={index === categories.length - 1}
                    onClick={() => void onMove(category, 1)}
                  >
                    <ChevronDownIcon />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${category.name}の名称を変更`}
                    onClick={() => onRename(category)}
                  >
                    <PencilIcon />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${category.name}を削除`}
                    onClick={() => onRemove(category)}
                  >
                    <Trash2Icon />
                  </UiButton>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

interface CategoryRenameModalProps {
  category: CategoryRecord | undefined;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** 名称変更。window.prompt はモーダルの外観・フォーカス制御を合わせられないので使わない。 */
function CategoryRenameModal({ category, onSubmit, onClose }: CategoryRenameModalProps) {
  const [name, setName] = useState('');
  const [loadedId, setLoadedId] = useState<string>();

  // 開き直したときに対象の名前を読み込む
  if (category && category.id !== loadedId) {
    setLoadedId(category.id);
    setName(category.name);
  }

  const isUnchanged = !name.trim() || name.trim() === category?.name;

  return (
    <Modal
      isOpen={category !== undefined}
      onClose={onClose}
      title="カテゴリ名を変更"
      icon={PencilIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" disabled={isUnchanged} onClick={() => onSubmit(name.trim())}>
            変更する
          </Button>
        </>
      }
    >
      <TextField
        label="カテゴリ名"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
    </Modal>
  );
}
