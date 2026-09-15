import { FilterXIcon, PackageIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Page, PageHeader, PageToolbar } from '@/core/PageLayout';
import { cn } from '@/lib/utils';
import { ItemDetailModal } from '@/modules/items/ItemDetailModal';
import { ItemEditModal } from '@/modules/items/ItemEditModal';
import type { Item } from '@/modules/items/useItems';
import { useItems } from '@/modules/items/useItems';

/** ITM-50 持ち物一覧・検索。分類・キーワード(名称/タグ/保管場所)で絞り込む(ITM-01, ITM-02)。 */
export function ItemsListPage() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const { items, totalCount, categories, isLoading, isError } = useItems(category, keyword);
  const [detailItem, setDetailItem] = useState<Item>();
  const [editItem, setEditItem] = useState<Item | 'new'>();

  const clearFilters = () => {
    setCategory('all');
    setKeyword('');
  };

  return (
    <Page>
      <PageHeader
        title="持ち物"
        meta={`${totalCount} 件`}
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setEditItem('new')}>
            持ち物を追加
          </Button>
        }
      />

      <SearchField
        value={keyword}
        onValueChange={setKeyword}
        ariaLabel="持ち物を検索"
        placeholder="名称・タグ・保管場所で検索"
        className="max-w-md"
      />

      <PageToolbar>
        <Chip isSelected={category === 'all'} onClick={() => setCategory('all')}>
          すべて
        </Chip>
        {categories.map((entry) => (
          <Chip
            key={entry.id}
            count={entry.count}
            isSelected={category === entry.id}
            onClick={() => setCategory(entry.id)}
          >
            {entry.label}
          </Chip>
        ))}
      </PageToolbar>

      {isError ? (
        // 端末への保存は実装していないので「保存済み」とは言えない(監査 H-2)
        <ErrorState
          title="持ち物を読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={3} hasBlock />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="まだ持ち物がありません"
          description="保証期限や保管場所と一緒に登録できます"
          action={
            <Button variant="primary" size="sm" icon={PlusIcon} onClick={() => setEditItem('new')}>
              持ち物を追加
            </Button>
          }
        />
      ) : items.length === 0 ? (
        // 1 件も無い状態と区別する。ここは絞り込みで消えただけなので作成導線は出さない
        <EmptyState
          icon={PackageIcon}
          title="条件に一致する持ち物がありません"
          description="キーワードや分類を変えてみてください"
          action={
            <Button variant="secondary" size="sm" icon={FilterXIcon} onClick={clearFilters}>
              絞り込みを解除
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} isRow onClick={() => setDetailItem(item)}>
              <span className="flex items-start gap-3">
                <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <PackageIcon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="max-w-full">
                      <span className="truncate">{item.category}</span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'max-w-full',
                        // 保証期限が近いことだけは色で伝える(それ以外は色を持たない)
                        item.isWarning && 'text-amber-600 dark:text-amber-400',
                      )}
                    >
                      <span className="truncate">{item.badge}</span>
                    </Badge>
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
    </Page>
  );
}
