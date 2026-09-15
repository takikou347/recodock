import { MapPinIcon, PlusIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { moduleThemeClass } from '../../lib/moduleTheme';
import { SpotDetailModal } from './SpotDetailModal';
import { SpotEditModal } from './SpotEditModal';
import type { Spot, SpotStatus } from './useSpots';
import { useSpots } from './useSpots';

import styles from './MapPage.module.css';

/** ピンの色は状態で分ける(訪問済み=地図色 / 行きたい=カレンダー色 / 日記ピン=日記色)。 */
const PIN_COLOR_VARS: Readonly<Record<SpotStatus, string>> = {
  visited: 'var(--color-map-solid)',
  wishlist: 'var(--color-calendar-solid)',
  diary: 'var(--color-diary-solid)',
};

/**
 * MAP-70 地図(ピン表示)。
 * デザインは iOS 版のみのため、同じ構成(検索・状態フィルタ・ピン・スポットカード)を PC 幅へ展開している。
 *
 * ピンは spots / map_entries の緯度経度を表示範囲へ正規化して配置する(useSpots)。
 * 下地は地図タイルではなく無地の面で、タイル配信元(ライセンス・API キー・費用)を
 * 決めてから MapLibre 等に差し替える。差し替え先は下地の描画だけで、ピンとカードは変わらない。
 */
export function MapPage() {
  const [status, setStatus] = useState<SpotStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState<string>();
  const [detailSpot, setDetailSpot] = useState<Spot>();
  const [editSpot, setEditSpot] = useState<Spot | 'new'>();
  const { spots, counts, isLoading, isError } = useSpots(status, keyword);

  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? spots[0];

  return (
    <div className={[styles.root, moduleThemeClass('map')].join(' ')}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchBox}>
            <Icon name="search" size={18} />
            <input
              className={styles.searchInput}
              type="search"
              value={keyword}
              placeholder="スポットを検索"
              aria-label="スポットを検索"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <Button variant="primary" icon={PlusIcon} onClick={() => setEditSpot('new')}>
            スポットを追加
          </Button>
        </div>
        <div className={styles.filters}>
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
        </div>
      </div>

      {isError ? (
        <div className={styles.states}>
          <ErrorState title="地図を読み込めませんでした" description="接続を確認してください。" />
        </div>
      ) : isLoading ? (
        <div className={styles.states}>
          <Skeleton lineCount={2} hasBlock />
        </div>
      ) : spots.length === 0 ? (
        <div className={styles.states}>
          <EmptyState
            icon={MapPinIcon}
            title="この条件のスポットはありません"
            description="日記や予定に位置情報を付けるとここに並びます"
          />
        </div>
      ) : (
        <div className={styles.canvas}>
          <span className={[styles.terrain, styles.river].join(' ')} />
          <span className={[styles.terrain, styles.park].join(' ')} />
          <span className={[styles.terrain, styles.block].join(' ')} />

          {spots.map((spot) => {
            const pinStyle: CSSProperties = {
              '--pin-x': `${spot.x}%`,
              '--pin-y': `${spot.y}%`,
              '--pin-color': PIN_COLOR_VARS[spot.status],
            } as CSSProperties;
            return (
              <button
                key={spot.id}
                type="button"
                className={[styles.pin, spot.id === selectedSpot?.id ? styles.pinSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                style={pinStyle}
                aria-label={`${spot.name}（記録 ${spot.entryCount} 件）`}
                onClick={() => setSelectedSpotId(spot.id)}
              >
                <span className={styles.pinDot}>{spot.entryCount}</span>
                <span className={styles.pinTail} />
              </button>
            );
          })}

          {selectedSpot ? (
            <div className={styles.spotCard}>
              <span className={styles.spotThumb}>
                <Icon name="map" size={22} />
              </span>
              <div className={styles.spotBody}>
                <p className={styles.spotName}>{selectedSpot.name}</p>
                <p className={styles.spotSummary}>{selectedSpot.summary}</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setDetailSpot(selectedSpot)}>
                詳細
              </Button>
            </div>
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
    </div>
  );
}
