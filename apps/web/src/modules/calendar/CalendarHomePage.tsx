import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  formatFullDate,
  formatHeadingDate,
  formatYearMonth,
  type ModuleKey,
  WEEKDAYS,
} from '@recodock/shared';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Fab } from '../../components/Fab';
import { Icon } from '../../components/icons/Icon';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Skeleton } from '../../components/Skeleton';
import { buildMonthGrid, isSameDay, shiftMonth, toDateKey } from '../../lib/calendarGrid';
import { weekdayColorVar } from '../../lib/format';
import { EventCreateModal } from './EventCreateModal';
import type { CalendarDay, TodayEntry } from './useCalendarEntries';
import { useCalendarMonth, useTodayEntries } from './useCalendarEntries';

import layout from '../../core/pageLayout.module.css';
import styles from './CalendarHomePage.module.css';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
  { value: 'month', label: '月' },
  { value: 'week', label: '週' },
  { value: 'day', label: '日' },
] as const satisfies readonly { value: CalendarView; label: string }[];

function toneStyle(moduleKey: ModuleKey): CSSProperties {
  return { '--tone-solid': `var(--color-${moduleKey}-solid)` } as CSSProperties;
}

/**
 * SC-04 ホーム(カレンダー) ＝ CAL-10 月表示。
 * 日付セルのクリックで CAL-13 日別記録一覧へ。バッジは calendar_entries ビューから集約。
 */
export function CalendarHomePage() {
  const navigate = useNavigate();
  // 「今日」は描画のたびに変わらないよう、マウント時に一度だけ確定させる
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const { daysByDate, isLoading, isError, refetch } = useCalendarMonth(month);
  const todayEntries = useTodayEntries(selectedDate);
  const cells = buildMonthGrid(month, today);

  return (
    <div className={styles.root}>
      <div className={styles.calendarPane}>
        <div className={styles.toolbar}>
          <h1 className={styles.month}>{formatYearMonth(month)}</h1>
          <div className={[layout.monthNav, styles.compactHide].join(' ')}>
            <button
              type="button"
              className={layout.monthNavButton}
              aria-label="前の月"
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              <Icon name="chevronLeft" size={14} />
            </button>
            <button
              type="button"
              className={layout.monthNavButton}
              aria-label="次の月"
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
          <span className={styles.compactHide}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDate(today);
              }}
            >
              今日
            </Button>
          </span>
          <div className={styles.viewSwitch}>
            <SegmentedControl
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
              ariaLabel="表示単位"
            />
          </div>
        </div>

        <div className={styles.weekdays}>
          {WEEKDAYS.map((label, index) => {
            const style: CSSProperties = { '--day-color': weekdayColorVar(index) } as CSSProperties;
            return (
              <span key={label} className={styles.weekday} style={style}>
                {label}
              </span>
            );
          })}
        </div>

        {isError ? (
          <ErrorState
            title="カレンダーを読み込めませんでした"
            description="記録は端末に保存済み。接続を確認してください。"
            onRetry={refetch}
          />
        ) : isLoading ? (
          <Skeleton lineCount={5} hasBlock />
        ) : (
          <div className={styles.grid}>
            {cells.map((cell) => (
              <DayCell
                key={cell.date.toISOString()}
                date={cell.date}
                isOutside={cell.isOutside}
                isToday={cell.isToday}
                day={daysByDate.get(toDateKey(cell.date))}
                onSelect={() => setSelectedDate(cell.date)}
                onOpenDay={() => navigate(`/calendar/days/${toDateKey(cell.date)}`)}
              />
            ))}
          </div>
        )}
      </div>

      <aside className={styles.detailPane}>
        <div>
          <p className={styles.detailDate}>{formatFullDate(selectedDate)}</p>
          <h2 className={styles.detailTitle}>
            {isSameDay(selectedDate, today)
              ? '今日の記録'
              : `${formatHeadingDate(selectedDate)}の記録`}
          </h2>
        </div>

        {todayEntries.isError ? (
          <ErrorState title="記録を読み込めませんでした" description="接続を確認してください。" />
        ) : todayEntries.isLoading ? (
          <Skeleton lineCount={3} />
        ) : todayEntries.entries.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="この日の記録はまだありません"
            description="＋ から予定や記録を追加できます"
          />
        ) : (
          <div className={styles.entries}>
            {todayEntries.entries.map((entry) => (
              <TodayEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        <Fab
          actions={[
            {
              moduleKey: 'calendar',
              icon: 'calendar',
              label: '予定を作成',
              onSelect: () => setIsEventModalOpen(true),
            },
            {
              moduleKey: 'money',
              icon: 'money',
              label: '取引を追加',
              onSelect: () => navigate('/money'),
            },
            {
              moduleKey: 'diary',
              icon: 'diary',
              label: '日記を書く',
              onSelect: () => navigate('/diary'),
            },
          ]}
        />
      </aside>

      <EventCreateModal
        isOpen={isEventModalOpen}
        date={selectedDate}
        onClose={() => setIsEventModalOpen(false)}
      />
    </div>
  );
}

interface DayCellProps {
  date: Date;
  isOutside: boolean;
  isToday: boolean;
  day: CalendarDay | undefined;
  onSelect: () => void;
  onOpenDay: () => void;
}

function DayCell({ date, isOutside, isToday, day, onSelect, onOpenDay }: DayCellProps) {
  const numberStyle: CSSProperties = {
    '--day-color': weekdayColorVar(date.getDay()),
  } as CSSProperties;

  return (
    <button
      type="button"
      className={[styles.cell, isOutside ? styles.cellOutside : '', isToday ? styles.cellToday : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={`${formatHeadingDate(date)}の記録`}
      onClick={onSelect}
      onDoubleClick={onOpenDay}
    >
      <span className={styles.dayNumber} style={numberStyle}>
        {date.getDate()}
      </span>

      {day?.events.map((event) => (
        <span key={event.id} className={styles.event}>
          {event.isAllDay
            ? `${event.title} 終日`
            : event.time
              ? `${event.title} ${event.time}`
              : event.title}
        </span>
      ))}

      {day && day.badges.length > 0 ? (
        <span className={styles.badges}>
          {day.badges.map((badge) => {
            const dotStyle: CSSProperties = {
              '--dot-color': `var(--color-${badge.moduleKey}-solid)`,
            } as CSSProperties;
            return (
              <span key={badge.moduleKey} className={styles.badge}>
                <span className={styles.badgeDot} style={dotStyle} />
                {badge.count}
              </span>
            );
          })}
        </span>
      ) : null}
    </button>
  );
}

interface TodayEntryCardProps {
  entry: TodayEntry;
}

function TodayEntryCard({ entry }: TodayEntryCardProps) {
  return (
    <Card isRow>
      <div className={styles.entry} style={toneStyle(entry.moduleKey)}>
        <span className={styles.entryRule} />
        <div className={styles.entryBody}>
          <p className={styles.entryModule}>{entry.moduleLabel}</p>
          <p className={styles.entryTitle}>{entry.title}</p>
          <p className={styles.entrySub}>{entry.sub}</p>
        </div>
      </div>
    </Card>
  );
}
