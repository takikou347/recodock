import { CalendarDaysIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AppError, type CalendarEventRecord, eventsRepo, formatTime } from '@recodock/shared';

import { Button } from '../../components/Button';
import { DatePicker } from '../../components/DatePicker';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { Toggle } from '../../components/Toggle';
import { useAuth } from '../../core/auth';
import { toDateKey } from '../../lib/monthRange';
import { supabase } from '../../lib/supabase';
import { useCreateEvent, useUpdateEvent } from './useCalendarEntries';

import styles from './EventCreateModal.module.css';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: '繰り返さない' },
  { value: 'weekly', label: '毎週（土曜）' },
  { value: 'monthly', label: '毎月（22日）' },
  { value: 'custom', label: 'カスタム…' },
] as const;

const REMINDER_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: '10', label: '10分前' },
  { value: '30', label: '30分前' },
  { value: '60', label: '1時間前' },
] as const;

type RecurrenceValue = (typeof RECURRENCE_OPTIONS)[number]['value'];

/** 画面の選択肢を RFC 5545 の RRULE に写す(CAL-03)。 */
const RRULE_BY_OPTION: Readonly<Record<Exclude<RecurrenceValue, 'none'>, string>> = {
  weekly: 'FREQ=WEEKLY;BYDAY=SA',
  monthly: 'FREQ=MONTHLY',
  custom: 'FREQ=WEEKLY',
};
type ReminderValue = (typeof REMINDER_OPTIONS)[number]['value'];

export interface EventCreateModalProps {
  isOpen: boolean;
  /** 初期日付(カレンダーで選択中の日) */
  date: Date;
  /** 渡すと編集モード(CAL-12 は作成・編集を兼ねる)。繰り返しはすべての回に反映 */
  event?: CalendarEventRecord;
  onClose: () => void;
}

/** CAL-12 予定作成・編集。PC は画面中央モーダル、SP はボトムシート(1e オーバーレイ規則)。 */
export function EventCreateModal({ isOpen, date, event, onClose }: EventCreateModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const createEvent = useCreateEvent(user?.id);
  const updateEvent = useUpdateEvent();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceValue>('none');
  const [reminder, setReminder] = useState<ReminderValue>('30');
  const [titleError, setTitleError] = useState<string>();
  const loadedEventId = useRef<string | undefined>(undefined);

  // 編集対象が来たらフォームへ読み込む(開き直すたびに一度だけ)
  useEffect(() => {
    if (!isOpen) {
      loadedEventId.current = undefined;
      return;
    }
    if (!event || loadedEventId.current === event.id) return;
    loadedEventId.current = event.id;
    const starts = new Date(event.startsAt);
    const ends = new Date(event.endsAt);
    setTitle(event.title);
    setStartDate(starts);
    setEndDate(ends);
    setStartTime(formatTime(starts));
    setEndTime(formatTime(ends));
    setLocation(event.location ?? '');
    setIsAllDay(event.isAllDay);
    setRecurrence(event.rrule ? (event.rrule.includes('MONTHLY') ? 'monthly' : 'weekly') : 'none');
  }, [isOpen, event]);

  const onSave = async () => {
    if (!title.trim()) {
      setTitleError('タイトルを入力してください');
      return;
    }
    const startsAt = new Date(`${toDateKey(startDate)}T${isAllDay ? '00:00' : startTime}:00`);
    const endsAt = new Date(`${toDateKey(endDate)}T${isAllDay ? '23:59' : endTime}:00`);
    if (endsAt < startsAt) {
      setTitleError('終了は開始以降にしてください');
      return;
    }
    setTitleError(undefined);
    const input = {
      title: title.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      isAllDay,
      location: location.trim() || null,
      rrule: recurrence === 'none' ? null : RRULE_BY_OPTION[recurrence],
    };
    try {
      const saved = event
        ? await updateEvent.mutateAsync({ eventId: event.id, input })
        : await createEvent.mutateAsync(input);
      // リマインドは分前の配列として置き換える(CAL-03)
      if (user) {
        await eventsRepo.replaceReminders(
          supabase,
          user.id,
          saved.id,
          reminder === 'none' ? [] : [Number(reminder)],
        );
      }
      showToast({ message: '予定を保存しました' });
      setTitle('');
      onClose();
    } catch (error) {
      setTitleError(error instanceof AppError ? error.message : '保存に失敗しました');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? '予定を編集' : '予定を作成'}
      icon={CalendarDaysIcon}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSave()}
            disabled={createEvent.isPending || updateEvent.isPending}
          >
            {createEvent.isPending || updateEvent.isPending ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label="タイトル"
        value={title}
        placeholder="散歩"
        errorText={titleError}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div className={styles.timeRow}>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>開始</span>
          <div className={styles.dateTimePair}>
            <DatePicker value={startDate} onChange={setStartDate} ariaLabel="開始日" />
            {!isAllDay ? (
              <input
                className={styles.timeInput}
                type="time"
                value={startTime}
                aria-label="開始時刻"
                onChange={(changeEvent) => setStartTime(changeEvent.target.value)}
              />
            ) : null}
          </div>
        </div>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>終了</span>
          <div className={styles.dateTimePair}>
            <DatePicker value={endDate} onChange={setEndDate} ariaLabel="終了日" />
            {!isAllDay ? (
              <input
                className={styles.timeInput}
                type="time"
                value={endTime}
                aria-label="終了時刻"
                onChange={(changeEvent) => setEndTime(changeEvent.target.value)}
              />
            ) : null}
          </div>
        </div>
        <div className={styles.allDay}>
          <Toggle isOn={isAllDay} onChange={setIsAllDay} label="終日" />
        </div>
      </div>

      <div className={styles.pairRow}>
        <div className={styles.pairField}>
          <span className={styles.fieldLabel}>繰り返し</span>
          <Select
            options={RECURRENCE_OPTIONS}
            value={recurrence}
            onChange={setRecurrence}
            ariaLabel="繰り返し"
          />
        </div>
        <div className={styles.pairField}>
          <span className={styles.fieldLabel}>リマインド</span>
          <Select
            options={REMINDER_OPTIONS}
            value={reminder}
            onChange={setReminder}
            ariaLabel="リマインド"
          />
        </div>
      </div>

      <TextField
        label="場所"
        value={location}
        placeholder="鴨川 三条"
        onChange={(changeEvent) => setLocation(changeEvent.target.value)}
      />
    </Modal>
  );
}
