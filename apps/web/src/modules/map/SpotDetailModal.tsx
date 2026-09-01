import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { SpotRecord } from '@recodock/shared';
import { diariesRepo, formatDateValue } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { supabase } from '../../lib/supabase';

import styles from './SpotDetailModal.module.css';

export interface SpotDetailModalProps {
  isOpen: boolean;
  spot: SpotRecord | undefined;
  onClose: () => void;
  onEdit: () => void;
}

/** MAP-71 スポット詳細。場所名・訪問日・メモと、関連日記への導線。 */
export function SpotDetailModal({ isOpen, spot, onClose, onEdit }: SpotDetailModalProps) {
  const navigate = useNavigate();
  const relatedDiaries = useQuery({
    queryKey: ['map', 'relatedDiaries', spot?.id ?? ''],
    queryFn: () => diariesRepo.listBySpot(supabase, spot?.id ?? ''),
    enabled: isOpen && Boolean(spot),
  });

  if (!spot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={spot.name}
      icon="map"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
          <Button variant="primary" onClick={onEdit}>
            編集
          </Button>
        </>
      }
    >
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>状態</span>
          <span className={styles.rowValue}>
            {spot.status === 'visited' ? '訪問済み' : '行きたい'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>訪問日</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {spot.visitedOn ? formatDateValue(new Date(`${spot.visitedOn}T00:00:00`)) : '未訪問'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>座標</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
          </span>
        </div>
        {spot.memo ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>メモ</span>
            <span className={styles.rowValue}>{spot.memo}</span>
          </div>
        ) : null}
      </div>

      <div className={styles.related}>
        <p className={styles.relatedLabel}>関連日記</p>
        {relatedDiaries.data && relatedDiaries.data.length > 0 ? (
          relatedDiaries.data.map((diary) => (
            <button
              key={diary.id}
              type="button"
              className={styles.relatedRow}
              onClick={() => {
                onClose();
                navigate(`/diary/${diary.id}`);
              }}
            >
              <span className={styles.relatedDate}>
                {formatDateValue(new Date(`${diary.entryDate}T00:00:00`))}
              </span>
              <span className={styles.relatedTitle}>{diary.body.split('\n')[0] || '(無題)'}</span>
            </button>
          ))
        ) : (
          <p className={styles.relatedEmpty}>このスポットに紐づく日記はまだありません</p>
        )}
      </div>
    </Modal>
  );
}
