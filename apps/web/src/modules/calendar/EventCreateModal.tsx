import { CalendarDaysIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  AppError,
  type CalendarEventRecord,
  eventsRepo,
  formatTime,
  WEEKDAYS,
} from '@recodock/shared';

import { Button } from '@/components/Button';
import { DatePicker } from '@/components/DatePicker';
import { Modal } from '@/components/Modal';
import type { SelectOption } from '@/components/Select';
import { Select } from '@/components/Select';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/core/auth';
import { toDateKey } from '@/lib/monthRange';
import { supabase } from '@/lib/supabase';
import { useCreateEvent, useUpdateEvent } from '@/modules/calendar/useCalendarEntries';

const REMINDER_OPTIONS = [
  { value: 'none', label: 'なし' },
  { value: '10', label: '10分前' },
  { value: '30', label: '30分前' },
  { value: '60', label: '1時間前' },
] as const;

type RecurrenceValue = 'none' | 'weekly' | 'monthly' | 'custom';
type ReminderValue = (typeof REMINDER_OPTIONS)[number]['value'];

/** RFC 5545 の BYDAY コード(0=日曜)。 */
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/**
 * 繰り返しの選択肢。曜日・日にちは開始日から導く。
 * 以前は土曜・22日が文字列に焼き込まれていて、火曜の予定でも BYDAY=SA が保存されていた。
 */
function buildRecurrenceOptions(startDate: Date): readonly SelectOption<RecurrenceValue>[] {
  return [
    { value: 'none', label: '繰り返さない' },
    { value: 'weekly', label: `毎週（${WEEKDAYS[startDate.getDay()]}曜）` },
    { value: 'monthly', label: `毎月（${startDate.getDate()}日）` },
    { value: 'custom', label: 'カスタム…' },
  ];
}

/** 画面の選択肢を RFC 5545 の RRULE に写す(CAL-03)。 */
function buildRrule(recurrence: RecurrenceValue, startDate: Date): string | null {
  if (recurrence === 'none') return null;
  if (recurrence === 'monthly') return `FREQ=MONTHLY;BYMONTHDAY=${startDate.getDate()}`;
  // カスタムの編集 UI はまだ無いので、毎週と同じ規則で保存する
  return `FREQ=WEEKLY;BYDAY=${WEEKDAY_CODES[startDate.getDay()]}`;
}

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
      rrule: buildRrule(recurrence, startDate),
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

  const isSaving = createEvent.isPending || updateEvent.isPending;

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
          <Button variant="primary" onClick={() => void onSave()} disabled={isSaving}>
            {isSaving ? '保存中…' : '保存する'}
          </Button>
        </>
      }
    >
      <TextField
        label="タイトル"
        value={title}
        placeholder="散歩"
        errorText={titleError}
        onChange={(changeEvent) => setTitle(changeEvent.target.value)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium">開始</span>
          <DatePicker value={startDate} onChange={setStartDate} ariaLabel="開始日" />
          {!isAllDay ? (
            <Input
              type="time"
              value={startTime}
              aria-label="開始時刻"
              className="font-mono tabular-nums"
              onChange={(changeEvent) => setStartTime(changeEvent.target.value)}
            />
          ) : null}
        </div>
        <span className="text-muted-foreground hidden pb-2 sm:block" aria-hidden="true">
          →
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium">終了</span>
          <DatePicker value={endDate} onChange={setEndDate} ariaLabel="終了日" />
          {!isAllDay ? (
            <Input
              type="time"
              value={endTime}
              aria-label="終了時刻"
              className="font-mono tabular-nums"
              onChange={(changeEvent) => setEndTime(changeEvent.target.value)}
            />
          ) : null}
        </div>
      </div>

      <Toggle isOn={isAllDay} onChange={setIsAllDay} label="終日" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-medium">繰り返し</span>
          <Select
            options={buildRecurrenceOptions(startDate)}
            value={recurrence}
            onChange={setRecurrence}
            ariaLabel="繰り返し"
            className="w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-medium">リマインド</span>
          <Select
            options={REMINDER_OPTIONS}
            value={reminder}
            onChange={setReminder}
            ariaLabel="リマインド"
            className="w-full"
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
