import { useState } from 'react';

import { Button } from '../../components/Button';
import { DatePicker } from '../../components/DatePicker';
import { Icon } from '../../components/icons/Icon';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/Toast';
import { Toggle } from '../../components/Toggle';

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
type ReminderValue = (typeof REMINDER_OPTIONS)[number]['value'];

export interface EventCreateModalProps {
  isOpen: boolean;
  /** 初期日付(カレンダーで選択中の日) */
  date: Date;
  onClose: () => void;
}

/**
 * CAL-12 予定作成。PC は画面中央モーダル、SP はボトムシート(1e オーバーレイ規則)。
 * TODO: events テーブルへの登録(リポジトリ関数＋mutation)を接続する。
 */
export function EventCreateModal({ isOpen, date, onClose }: EventCreateModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceValue>('weekly');
  const [reminder, setReminder] = useState<ReminderValue>('30');
  const [titleError, setTitleError] = useState<string>();

  const onSave = () => {
    if (!title.trim()) {
      setTitleError('タイトルを入力してください');
      return;
    }
    setTitleError(undefined);
    showToast({ message: '予定を保存しました' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="予定を作成"
      icon="calendar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={onSave}>
            保存する
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
          <DatePicker value={startDate} onChange={setStartDate} ariaLabel="開始日" />
        </div>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>終了</span>
          <DatePicker value={endDate} onChange={setEndDate} ariaLabel="終了日" />
        </div>
        <div className={styles.allDay}>
          <Toggle isOn={isAllDay} onChange={setIsAllDay} label="終日" size="sm" ariaLabel="終日" />
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

      <div>
        <span className={styles.fieldLabel}>場所</span>
        <button type="button" className={styles.location}>
          <span className={styles.locationIcon}>
            <Icon name="map" size={17} />
          </span>
          鴨川 三条
          <span className={styles.spotBadge}>地図のスポット</span>
        </button>
      </div>
    </Modal>
  );
}
