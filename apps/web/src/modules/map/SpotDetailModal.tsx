import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon, MapPinIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { SpotRecord } from '@recodock/shared';
import { diariesRepo, formatDateValue } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export interface SpotDetailModalProps {
  isOpen: boolean;
  spot: SpotRecord | undefined;
  onClose: () => void;
  onEdit: () => void;
}

interface DetailRowProps {
  label: string;
  value: string;
  /** 日付・座標を等幅で揃える */
  isNumeric?: boolean;
}

function DetailRow({ label, value, isNumeric = false }: DetailRowProps) {
  return (
    <div className="flex items-baseline gap-3 border-b pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground w-24 shrink-0 text-sm">{label}</dt>
      <dd
        className={cn(
          'min-w-0 flex-1 text-sm font-medium wrap-anywhere',
          isNumeric && 'font-mono tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
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

  const diaries = relatedDiaries.data ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={spot.name}
      icon={MapPinIcon}
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
      <dl className="grid gap-3">
        <DetailRow label="状態" value={spot.status === 'visited' ? '訪問済み' : '行きたい'} />
        <DetailRow
          label="訪問日"
          value={
            spot.visitedOn ? formatDateValue(new Date(`${spot.visitedOn}T00:00:00`)) : '未訪問'
          }
          isNumeric
        />
        <DetailRow
          label="座標"
          value={`${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`}
          isNumeric
        />
        {spot.memo ? <DetailRow label="メモ" value={spot.memo} /> : null}
      </dl>

      <section className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">関連日記</h3>
        {relatedDiaries.isPending ? (
          <Skeleton lineCount={2} />
        ) : diaries.length > 0 ? (
          <Card isFlush className="overflow-hidden">
            {diaries.map((diary) => (
              <button
                key={diary.id}
                type="button"
                className="hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full items-baseline gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 focus-visible:ring-[3px] focus-visible:outline-none"
                onClick={() => {
                  onClose();
                  navigate(`/diary/${diary.id}`);
                }}
              >
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {formatDateValue(new Date(`${diary.entryDate}T00:00:00`))}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {diary.body.split('\n')[0] || '(無題)'}
                </span>
                <ChevronRightIcon
                  className="text-muted-foreground size-4 shrink-0 self-center"
                  aria-hidden="true"
                />
              </button>
            ))}
          </Card>
        ) : (
          <p className="text-muted-foreground text-sm">このスポットに紐づく日記はまだありません</p>
        )}
      </section>
    </Modal>
  );
}
