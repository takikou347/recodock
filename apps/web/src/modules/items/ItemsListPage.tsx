import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { ItemDetailModal } from './ItemDetailModal';
import { ItemEditModal } from './ItemEditModal';
import type { Item } from './useItems';
import { useItems } from './useItems';

import layout from '../../core/pageLayout.module.css';
import styles from './ItemsListPage.module.css';

/** ITM-50 持ち物一覧・検索。分類・キーワード(名称/タグ/保管場所)で絞り込む(ITM-01, ITM-02)。 */
export function ItemsListPage() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const { items, totalCount, categories, isLoading, isError } = useItems(category, keyword);
  const [detailItem, setDetailItem] = useState<Item>();
  const [editItem, setEditItem] = useState<Item | 'new'>();

  return (
    <div className={[layout.page, moduleThemeClass('items')].join(' ')}>
      <div className={layout.header}>
        <h1 className={layout.titleSm}>持ち物</h1>
        <span className={layout.count}>{totalCount}件</span>
        <div className={layout.actions}>
          <Button variant="primary" icon="plus" onClick={() => setEditItem('new')}>
            持ち物を追加
          </Button>
        </div>
      </div>

      <div className={styles.searchBox}>
        <Icon name="search" size={16} />
        <input
          className={styles.searchInput}
          type="search"
          value={keyword}
          placeholder="名称・タグ・保管場所で検索"
          aria-label="持ち物を検索"
          onChange={(event) => setKeyword(event.target.value)}
        />
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
            <Button variant="primary" size="sm" icon="plus" onClick={() => setEditItem('new')}>
              持ち物を追加
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <Card key={item.id} isFlush onClick={() => setDetailItem(item)}>
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

      <ItemDetailModal
        isOpen={Boolean(detailItem)}
        item={detailItem?.raw}
        onClose={() => setDetailItem(undefined)}
        onEdit={() => {
          setEditItem(detailItem ?? 'new');
          setDetailItem(undefined);
        }}
      />
      <ItemEditModal
        isOpen={editItem !== undefined}
        item={editItem === 'new' ? undefined : editItem?.raw}
        onClose={() => setEditItem(undefined)}
      />
    </div>
  );
}
