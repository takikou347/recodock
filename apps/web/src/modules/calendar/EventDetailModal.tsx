import { CalendarDaysIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { CalendarEventRecord } from '@recodock/shared';
import { formatFullDate, formatTime } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/core/auth';
import {
  useCancelOccurrence,
  useDeleteEvent,
  useEventReminders,
} from '@/modules/calendar/useCalendarEntries';

export interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 表示対象の予定 */
  event: CalendarEventRecord | undefined;
  /** この回の発生日時(ISO)。繰り返しの例外操作に使う */
  occurrenceIso: string | undefined;
  /** 編集(CAL-12)を開く */
  onEdit: () => void;
}

/** RRULE を人が読める表現に変える(CAL-11 の表示用)。 */
function describeRrule(rrule: string | null): string | null {
  if (!rrule) return null;
  if (rrule.includes('FREQ=DAILY')) return '毎日';
  if (rrule.includes('FREQ=WEEKLY')) return '毎週';
  if (rrule.includes('FREQ=MONTHLY')) return '毎月';
  return '繰り返し';
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-baseline gap-3 border-b pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground w-20 shrink-0 text-sm">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">{children}</dd>
    </div>
  );
}

/**
 * CAL-11 予定詳細。繰り返しの場合、削除は「この回のみ / すべての回」に分岐する
 * (この回のみ = event_overrides の取り消し行)。
 */
export function EventDetailModal({
  isOpen,
  onClose,
  event,
  occurrenceIso,
  onEdit,
}: EventDetailModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const reminders = useEventReminders(event?.id);
  const deleteEvent = useDeleteEvent();
  const cancelOccurrence = useCancelOccurrence(user?.id);
  const [isChoosingDelete, setIsChoosingDelete] = useState(false);

  if (!event) return null;

  const occurrence = occurrenceIso ? new Date(occurrenceIso) : new Date(event.startsAt);
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const repeatLabel = describeRrule(event.rrule);

  const onDeleteAll = async () => {
    await deleteEvent.mutateAsync(event.id);
    showToast({ message: '予定を削除しました' });
    onClose();
  };

  const onDeleteOccurrence = async () => {
    if (!occurrenceIso) return;
    await cancelOccurrence.mutateAsync({ eventId: event.id, occurrenceIso });
    showToast({ message: 'この回の予定を削除しました' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      icon={CalendarDaysIcon}
      footer={
        <>
          <Button
            variant="text"
            onClick={() => {
              if (repeatLabel) setIsChoosingDelete(true);
              else void onDeleteAll();
            }}
            disabled={deleteEvent.isPending || cancelOccurrence.isPending}
          >
            削除
          </Button>
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
          <Button variant="primary" onClick={onEdit}>
            編集
          </Button>
        </>
      }
    >
      <dl className="flex flex-col gap-2.5">
        <DetailRow label="日付">
          <span className="font-mono tabular-nums">{formatFullDate(occurrence)}</span>
          {repeatLabel ? <Badge variant="secondary">{repeatLabel}</Badge> : null}
        </DetailRow>
        <DetailRow label="時間">
          <span className="font-mono tabular-nums">
            {event.isAllDay ? '終日' : `${formatTime(startsAt)} 〜 ${formatTime(endsAt)}`}
          </span>
        </DetailRow>
        {event.location ? (
          <DetailRow label="場所">
            <span className="truncate">{event.location}</span>
          </DetailRow>
        ) : null}
        {event.memo ? (
          <DetailRow label="メモ">
            {/* メモは省略せず折り返す。詳細画面で本文が読めないほうが困る */}
            <span className="wrap-anywhere whitespace-pre-wrap">{event.memo}</span>
          </DetailRow>
        ) : null}
        <DetailRow label="リマインド">
          {reminders.length > 0 ? reminders.map((minutes) => `${minutes}分前`).join(' / ') : 'なし'}
        </DetailRow>
      </dl>

      {isChoosingDelete ? (
        <div
          className="flex flex-col gap-2 rounded-lg border border-dashed p-3"
          role="group"
          aria-label="削除の範囲"
        >
          <span className="text-sm font-medium">繰り返しの予定です。どの範囲を削除しますか？</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void onDeleteOccurrence()}>
              この回のみ
            </Button>
            <Button variant="danger" size="sm" onClick={() => void onDeleteAll()}>
              すべての回
            </Button>
            <Button variant="text" size="sm" onClick={() => setIsChoosingDelete(false)}>
              やめる
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
