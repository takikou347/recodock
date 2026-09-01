import { useState } from 'react';

import type { CategoryRecord } from '@recodock/shared';
import { AppError } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { useCategoryActions, useCategoryGroups } from './useCategories';

import layout from '../../core/pageLayout.module.css';
import styles from './CategoriesPage.module.css';

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

  const onRename = async (category: CategoryRecord) => {
    const name = window.prompt('カテゴリ名', category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    await rename(category.id, name.trim());
    showToast({ message: 'カテゴリ名を変更しました' });
  };

  const onRemove = async (category: CategoryRecord) => {
    try {
      await remove(category.id);
      showToast({ message: `${category.name}を削除しました` });
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
    <div className={[layout.page, moduleThemeClass('money')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>カテゴリ管理</h1>
      </div>

      {isError ? (
        <ErrorState
          title="カテゴリを読み込めませんでした"
          description="接続を確認してください。"
          onRetry={refetch}
        />
      ) : isLoading ? (
        <Skeleton lineCount={5} />
      ) : (
        <>
          <Card>
            <div className={styles.addRow}>
              <div className={styles.addField}>
                <TextField
                  label="新しいカテゴリ"
                  value={newName}
                  placeholder="サブスク"
                  errorText={errorText}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </div>
              <div className={styles.kindSwitch} role="radiogroup" aria-label="カテゴリの種類">
                <button
                  type="button"
                  role="radio"
                  aria-checked={newKind === 'expense'}
                  className={[styles.kindOption, newKind === 'expense' ? styles.kindSelected : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setNewKind('expense')}
                >
                  支出用
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={newKind === 'income'}
                  className={[styles.kindOption, newKind === 'income' ? styles.kindSelected : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setNewKind('income')}
                >
                  収入用
                </button>
              </div>
              <Button variant="primary" icon="plus" onClick={() => void onAdd()}>
                追加
              </Button>
            </div>
          </Card>

          <CategoryGroup
            title={`支出カテゴリ ${expenseCategories.length}`}
            categories={expenseCategories}
            onRename={onRename}
            onRemove={onRemove}
            onMove={move}
          />
          <CategoryGroup
            title={`収入カテゴリ ${incomeCategories.length}`}
            categories={incomeCategories}
            onRename={onRename}
            onRemove={onRemove}
            onMove={move}
          />
        </>
      )}
    </div>
  );
}

interface CategoryGroupProps {
  title: string;
  categories: readonly CategoryRecord[];
  onRename: (category: CategoryRecord) => Promise<void>;
  onRemove: (category: CategoryRecord) => Promise<void>;
  onMove: (category: CategoryRecord, direction: -1 | 1) => Promise<void>;
}

function CategoryGroup({ title, categories, onRename, onRemove, onMove }: CategoryGroupProps) {
  return (
    <section className={styles.group}>
      <h2 className={layout.sectionLabel}>{title}</h2>
      <Card isFlush>
        {categories.map((category, index) => (
          <div key={category.id} className={styles.row}>
            <span className={styles.rowName}>{category.name}</span>
            <span className={styles.rowActions}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`${category.name}を上へ`}
                disabled={index === 0}
                onClick={() => void onMove(category, -1)}
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`${category.name}を下へ`}
                disabled={index === categories.length - 1}
                onClick={() => void onMove(category, 1)}
              >
                <Icon name="chevronRight" size={14} />
              </button>
              <Button variant="text" size="sm" onClick={() => void onRename(category)}>
                名称変更
              </Button>
              <Button variant="text" size="sm" onClick={() => void onRemove(category)}>
                削除
              </Button>
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}
