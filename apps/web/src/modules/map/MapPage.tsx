import type { LucideIcon } from 'lucide-react';
import { BookOpenIcon, CheckIcon, FilterXIcon, MapPinIcon, PlusIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { Page, PageHeader, PageToolbar } from '@/core/PageLayout';
import { cn } from '@/lib/utils';
import { SpotDetailModal } from '@/modules/map/SpotDetailModal';
import { SpotEditModal } from '@/modules/map/SpotEditModal';
import type { Spot, SpotStatus } from '@/modules/map/useSpots';
import { useSpots } from '@/modules/map/useSpots';

/** ピンの状態はアイコンで区別する。色に意味を持たせない(ADR-0008)。 */
const STATUS_ICONS: Readonly<Record<SpotStatus, LucideIcon>> = {
  visited: CheckIcon,
  wishlist: StarIcon,
  diary: BookOpenIcon,
};

/**
 * MAP-70 地図(ピン表示)。
 *
 * ピンは spots / map_entries の緯度経度を表示範囲へ正規化して配置する(useSpots)。
 * 下地は地図タイルではなく方眼で、タイル配信元(ライセンス・API キー・費用)を
 * 決めてから MapLibre 等に差し替える。差し替え先は下地の描画だけで、ピンとカードは変わらない。
 */
export function MapPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SpotStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState<string>();
  const [detailSpot, setDetailSpot] = useState<Spot>();
  const [editSpot, setEditSpot] = useState<Spot | 'new'>();
  const { spots, counts, isLoading, isError } = useSpots(status, keyword);

  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? spots[0];
  // 絞り込み前の総数。0 件と「条件に一致しない」を区別するために使う
  const totalCount = counts.visited + counts.wishlist + counts.diary;

  const clearFilters = () => {
    setStatus('all');
    setKeyword('');
  };

  return (
    <Page>
      <PageHeader
        title="地図"
        meta={`${totalCount} 件`}
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setEditSpot('new')}>
            スポットを追加
          </Button>
        }
      />

      <SearchField
        value={keyword}
        onValueChange={setKeyword}
        ariaLabel="スポットを検索"
        placeholder="場所名で検索"
        className="max-w-md"
      />

      <PageToolbar>
        <Chip isSelected={status === 'all'} onClick={() => setStatus('all')}>
          すべて
        </Chip>
        <Chip
          count={counts.visited}
          isSelected={status === 'visited'}
          onClick={() => setStatus('visited')}
        >
          訪問済み
        </Chip>
        <Chip
          count={counts.wishlist}
          isSelected={status === 'wishlist'}
          onClick={() => setStatus('wishlist')}
        >
          行きたい
        </Chip>
        <Chip
          count={counts.diary}
          isSelected={status === 'diary'}
          onClick={() => setStatus('diary')}
        >
          日記ピン
        </Chip>
      </PageToolbar>

      {isError ? (
        <ErrorState
          title="地図を読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={2} hasBlock />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="まだスポットがありません"
          description="行った場所・行きたい場所を登録すると地図に並びます"
          action={
            <Button variant="primary" size="sm" icon={PlusIcon} onClick={() => setEditSpot('new')}>
              スポットを追加
            </Button>
          }
        />
      ) : spots.length === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="条件に一致するスポットがありません"
          description="キーワードや状態を変えてみてください"
          action={
            <Button variant="secondary" size="sm" icon={FilterXIcon} onClick={clearFilters}>
              絞り込みを解除
            </Button>
          }
        />
      ) : (
        <div className="bg-muted/40 relative min-h-[420px] flex-1 overflow-hidden rounded-xl border">
          <span
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />
          <p className="text-muted-foreground absolute top-2 left-3 text-xs">
            地図タイル導入までの暫定表示(位置は相対)
          </p>

          {spots.map((spot) => {
            const StatusIcon = STATUS_ICONS[spot.status];
            const isSelected = spot.id === selectedSpot?.id;
            return (
              <button
                key={spot.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                aria-label={`${spot.name}（記録 ${spot.entryCount} 件）`}
                aria-pressed={isSelected}
                onClick={() => setSelectedSpotId(spot.id)}
              >
                <span
                  className={cn(
                    'focus-visible:ring-ring/50 flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium shadow-sm transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'bg-background hover:bg-muted',
                  )}
                >
                  <StatusIcon className="size-3.5" aria-hidden="true" />
                  <span className="tabular-nums">{spot.entryCount}</span>
                </span>
              </button>
            );
          })}

          {selectedSpot ? (
            <Card className="absolute inset-x-4 bottom-4 max-w-lg">
              <div className="flex items-center gap-3">
                <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <MapPinIcon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{selectedSpot.name}</p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {selectedSpot.summary}
                  </p>
                </div>
                {/* 日記由来のピンはスポット行を持たないので、詳細ではなく日記本体へ送る(監査 H-4) */}
                {selectedSpot.raw ? (
                  <Button variant="primary" size="sm" onClick={() => setDetailSpot(selectedSpot)}>
                    詳細
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/diary/${selectedSpot.id}`)}
                  >
                    日記を開く
                  </Button>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <SpotDetailModal
        isOpen={Boolean(detailSpot)}
        spot={detailSpot?.raw}
        onClose={() => setDetailSpot(undefined)}
        onEdit={() => {
          setEditSpot(detailSpot ?? 'new');
          setDetailSpot(undefined);
        }}
      />
      <SpotEditModal
        isOpen={editSpot !== undefined}
        spot={editSpot === 'new' ? undefined : editSpot?.raw}
        onClose={() => setEditSpot(undefined)}
      />
    </Page>
  );
}
