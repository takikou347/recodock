import { CalendarDaysIcon } from 'lucide-react';
import { useState } from 'react';

import type { CalendarEventRecord } from '@recodock/shared';
import { formatFullDate, formatTime } from '@recodock/shared';

import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../core/auth';
import { useCancelOccurrence, useDeleteEvent, useEventReminders } from './useCalendarEntries';

import styles from './EventDetailModal.module.css';

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
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>日付</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {formatFullDate(occurrence)}
          </span>
          {repeatLabel ? <span className={styles.repeatBadge}>{repeatLabel}</span> : null}
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>時間</span>
          <span className={[styles.rowValue, styles.mono].join(' ')}>
            {event.isAllDay ? '終日' : `${formatTime(startsAt)} 〜 ${formatTime(endsAt)}`}
          </span>
        </div>
        {event.location ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>場所</span>
            <span className={styles.rowValue}>{event.location}</span>
          </div>
        ) : null}
        {event.memo ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>メモ</span>
            <span className={styles.rowValue}>{event.memo}</span>
          </div>
        ) : null}
        <div className={styles.row}>
          <span className={styles.rowLabel}>リマインド</span>
          <span className={styles.rowValue}>
            {reminders.length > 0
              ? reminders.map((minutes) => `${minutes}分前`).join(' / ')
              : 'なし'}
          </span>
        </div>
      </div>

      {isChoosingDelete ? (
        <div className={styles.deleteChoice} role="group" aria-label="削除の範囲">
          <span className={styles.deleteChoiceLabel}>
            繰り返しの予定です。どの範囲を削除しますか？
          </span>
          <div className={styles.deleteChoiceButtons}>
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
