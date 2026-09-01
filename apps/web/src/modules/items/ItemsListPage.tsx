import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { QuickCreateModal } from '../../components/QuickCreateModal';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { useCreateItem, useItems } from './useItems';

import layout from '../../core/pageLayout.module.css';
import styles from './ItemsListPage.module.css';

/** ITM-50 持ち物一覧。分類と保証期限で絞り込む。 */
export function ItemsListPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const { items, totalCount, categories, isLoading, isError } = useItems(category);
  const createItem = useCreateItem(user?.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const onCreate = async (name: string) => {
    await createItem.mutateAsync({ name });
    showToast({ message: `${name}を追加しました` });
  };

  return (
    <div className={[layout.page, moduleThemeClass('items')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>持ち物</h1>
        <span className={layout.count}>{totalCount}件</span>
        <div className={layout.actions}>
          <Button variant="primary" icon="plus" onClick={() => setIsCreateOpen(true)}>
            持ち物を追加
          </Button>
        </div>
      </div>

      <div className={layout.filters}>
        <Chip isSelected={category === 'all'} onClick={() => setCategory('all')}>
          すべて
        </Chip>
        {categories.map((entry) => (
          <Chip
            key={entry.id}
            tone={entry.id === 'warning' ? 'diary' : 'items'}
            count={entry.count}
            isSelected={category === entry.id}
            onClick={() => setCategory(entry.id)}
          >
            {entry.label}
          </Chip>
        ))}
      </div>

      {isError ? (
        <ErrorState
          title="持ち物を読み込めませんでした"
          description="記録は端末に保存済み。接続を確認してください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={3} hasBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon="items"
          title="まだ持ち物がありません"
          description="保証期限や保管場所と一緒に登録できます"
          action={
            <Button variant="primary" size="sm" icon="plus" onClick={() => setIsCreateOpen(true)}>
              持ち物を追加
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <Card key={item.id} isFlush onClick={() => undefined}>
              <span className={styles.thumb}>
                <Icon name="image" size={24} />
              </span>
              <span className={styles.body}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.badges}>
                  <span className={styles.badge}>{item.category}</span>
                  <span
                    className={[styles.badge, item.isWarning ? styles.badgeWarning : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {item.badge}
                  </span>
                </span>
              </span>
            </Card>
          ))}
        </div>
      )}

      <QuickCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="持ち物を追加"
        icon="items"
        fieldLabel="持ち物の名前"
        placeholder="加湿器"
        isSaving={createItem.isPending}
        onSubmit={onCreate}
      />
    </div>
  );
}
