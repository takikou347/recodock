import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  type LucideIcon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  StickyNoteIcon,
  WalletIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';
import { formatFullDate, formatHeadingDate, formatYearMonth, WEEKDAYS } from '@recodock/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Fab } from '@/components/Fab';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { Button as UiButton } from '@/components/ui/button';
import { useAuth } from '@/core/auth';
import { Page, PageHeader } from '@/core/PageLayout';
import { buildMonthGrid, isSameDay, shiftMonth, toDateKey } from '@/lib/calendarGrid';
import { weekdayTextClass } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EventCreateModal } from '@/modules/calendar/EventCreateModal';
import { EventDetailModal } from '@/modules/calendar/EventDetailModal';
import type {
  CalendarDay,
  CalendarEvent,
  DayEntrySection,
  TodayEntry,
} from '@/modules/calendar/useCalendarEntries';
import {
  useCalendarMonth,
  useDayEntries,
  useTodayEntries,
} from '@/modules/calendar/useCalendarEntries';
import { useCreateDiary } from '@/modules/diary/useDiaries';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
  { value: 'month', label: '月' },
  { value: 'week', label: '週' },
  { value: 'day', label: '日' },
] as const satisfies readonly { value: CalendarView; label: string }[];

/** 読み込み失敗時の文言。ローカル保存は無いので「端末に保存済み」とは言えない(監査 H-2)。 */
const LOAD_ERROR_DESCRIPTION = '通信を確認してもう一度お試しください。';
const EMPTY_DAY_TITLE = 'この日の記録はまだありません';
const EMPTY_DAY_DESCRIPTION = '＋ から予定や記録を追加できます';

/**
 * 件数バッジはモジュールごとの色で見分けていたが、色分けは ADR-0008 で廃止した。
 * 代わりにアイコンで見分け、読み上げ用の名前をここから作る。
 */
const MODULE_BADGES: Readonly<Record<ModuleKey, { icon: LucideIcon; label: string }>> = {
  calendar: { icon: CalendarDaysIcon, label: '予定' },
  money: { icon: WalletIcon, label: '家計簿' },
  diary: { icon: BookOpenIcon, label: '日記' },
  items: { icon: PackageIcon, label: '持ち物' },
  notes: { icon: StickyNoteIcon, label: 'メモ' },
  map: { icon: MapPinIcon, label: '地図' },
};

/**
 * SC-04 ホーム(カレンダー) ＝ CAL-10 月表示。
 * 日付セルから CAL-13 日別記録一覧へ。バッジは calendar_entries ビューから集約。
 */
export function CalendarHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createDiary = useCreateDiary(user?.id);
  // 「今日」は描画のたびに変わらないよう、マウント時に一度だけ確定させる
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<{ eventId: string; occurrenceIso: string }>();
  const [editTarget, setEditTarget] = useState<{ eventId: string; occurrenceIso: string }>();

  const { daysByDate, eventsById, isLoading, isError, refetch } = useCalendarMonth(month);
  const todayEntries = useTodayEntries(selectedDate);
  const dayEntries = useDayEntries(selectedDate);
  const cells = buildMonthGrid(month, today);
  // 週表示は選択日を含む週の 7 日(01_screen_design.md 4 章)
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  const weekCells = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + index,
    );
    return {
      date,
      isOutside: date.getMonth() !== month.getMonth(),
      isToday: isSameDay(date, today),
    };
  });

  const detailEvent = detailTarget ? eventsById.get(detailTarget.eventId) : undefined;
  const editEvent = editTarget ? eventsById.get(editTarget.eventId) : undefined;
  const openDetail = (calendarEvent: CalendarEvent) =>
    setDetailTarget({ eventId: calendarEvent.eventId, occurrenceIso: calendarEvent.occurrenceIso });

  const renderCell = (cell: { date: Date; isOutside: boolean; isToday: boolean }) => (
    <DayCell
      key={cell.date.toISOString()}
      date={cell.date}
      isOutside={cell.isOutside}
      isToday={cell.isToday}
      isSelected={isSameDay(cell.date, selectedDate)}
      day={daysByDate.get(toDateKey(cell.date))}
      onSelect={() => setSelectedDate(cell.date)}
      onOpenDay={() => navigate(`/calendar/days/${toDateKey(cell.date)}`)}
      onOpenEvent={openDetail}
    />
  );

  return (
    <Page>
      <PageHeader
        title={formatYearMonth(month)}
        actions={
          <>
            <div className="flex gap-1">
              <UiButton
                variant="outline"
                size="icon-sm"
                aria-label="前の月"
                onClick={() => setMonth((current) => shiftMonth(current, -1))}
              >
                <ChevronLeftIcon />
              </UiButton>
              <UiButton
                variant="outline"
                size="icon-sm"
                aria-label="次の月"
                onClick={() => setMonth((current) => shiftMonth(current, 1))}
              >
                <ChevronRightIcon />
              </UiButton>
            </div>
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
            <SegmentedControl
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
              ariaLabel="表示単位"
            />
          </>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-0 min-w-0 flex-col gap-1.5">
          {view !== 'day' ? (
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5" aria-hidden="true">
              {WEEKDAYS.map((label, index) => (
                <span
                  key={label}
                  className={cn('text-center text-xs font-medium', weekdayTextClass(index))}
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {isError ? (
            <ErrorState
              title="カレンダーを読み込めませんでした"
              description={LOAD_ERROR_DESCRIPTION}
              onRetry={refetch}
            />
          ) : isLoading ? (
            <Skeleton lineCount={5} hasBlock />
          ) : view === 'day' ? (
            <DayView
              date={selectedDate}
              sections={dayEntries.sections}
              isLoading={dayEntries.isLoading}
              isError={dayEntries.isError}
              onOpenEvent={(eventId) => setDetailTarget({ eventId, occurrenceIso: '' })}
            />
          ) : (
            <div className="grid min-h-0 flex-1 auto-rows-[minmax(3.25rem,1fr)] grid-cols-7 gap-1 sm:auto-rows-[minmax(5rem,1fr)] sm:gap-1.5">
              {(view === 'month' ? cells : weekCells).map(renderCell)}
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:border-l lg:pl-4">
          <div className="min-w-0">
            <p className="text-muted-foreground font-mono text-xs tracking-wider">
              {formatFullDate(selectedDate)}
            </p>
            <h2 className="font-heading truncate text-lg font-semibold">
              {isSameDay(selectedDate, today)
                ? '今日の記録'
                : `${formatHeadingDate(selectedDate)}の記録`}
            </h2>
            <Button
              variant="text"
              size="sm"
              icon={PlusIcon}
              className="mt-1 -ml-2.5"
              onClick={() => setIsEventModalOpen(true)}
            >
              この日に予定を追加
            </Button>
          </div>

          {todayEntries.isError ? (
            <ErrorState title="記録を読み込めませんでした" description={LOAD_ERROR_DESCRIPTION} />
          ) : todayEntries.isLoading ? (
            <Skeleton lineCount={3} />
          ) : todayEntries.entries.length === 0 ? (
            <EmptyState
              icon={CalendarDaysIcon}
              title={EMPTY_DAY_TITLE}
              description={EMPTY_DAY_DESCRIPTION}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {todayEntries.entries.map((entry) => (
                <TodayEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </aside>
      </div>

      <Fab
        actions={[
          {
            moduleKey: 'calendar',
            icon: CalendarDaysIcon,
            label: '予定を作成',
            onSelect: () => setIsEventModalOpen(true),
          },
          {
            moduleKey: 'money',
            icon: WalletIcon,
            label: '取引を追加',
            onSelect: () => navigate('/money'),
          },
          {
            moduleKey: 'diary',
            icon: BookOpenIcon,
            label: '日記を書く',
            onSelect: () => {
              void createDiary
                .mutateAsync({ entryDate: toDateKey(selectedDate), body: '' })
                .then((created) => navigate(`/diary/${created.id}/edit`));
            },
          },
        ]}
      />

      <EventCreateModal
        isOpen={isEventModalOpen}
        date={selectedDate}
        onClose={() => setIsEventModalOpen(false)}
      />

      <EventDetailModal
        isOpen={Boolean(detailTarget)}
        event={detailEvent}
        occurrenceIso={detailTarget?.occurrenceIso || detailEvent?.startsAt}
        onClose={() => setDetailTarget(undefined)}
        onEdit={() => {
          setEditTarget(detailTarget);
          setDetailTarget(undefined);
        }}
      />

      <EventCreateModal
        isOpen={Boolean(editTarget)}
        date={selectedDate}
        event={editEvent}
        onClose={() => setEditTarget(undefined)}
      />
    </Page>
  );
}

interface DayCellProps {
  date: Date;
  isOutside: boolean;
  isToday: boolean;
  isSelected: boolean;
  day: CalendarDay | undefined;
  onSelect: () => void;
  /** CAL-13 日別記録一覧へ */
  onOpenDay: () => void;
  /** 予定チップのクリックで CAL-11 詳細を開く */
  onOpenEvent: (event: CalendarEvent) => void;
}

/**
 * 月・週グリッドの 1 日。
 * セル自体は入れ物に徹し、押せるものは日付ボタンと予定チップという兄弟の実 `<button>` だけにする。
 * 以前はセルが `role="button"` で、その中に予定チップの `<button>` が入れ子になっており、
 * 日別画面へはダブルクリックでしか行けなかった(監査 C-4)。
 */
function DayCell({
  date,
  isOutside,
  isToday,
  isSelected,
  day,
  onSelect,
  onOpenDay,
  onOpenEvent,
}: DayCellProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col gap-0.5 overflow-hidden rounded-md border p-1 sm:gap-1 sm:p-1.5',
        isOutside && 'bg-muted/40',
        isToday && 'border-foreground',
        isSelected && 'ring-ring/60 ring-2',
      )}
    >
      <button
        type="button"
        aria-label={`${formatHeadingDate(date)}の記録`}
        aria-current={isToday ? 'date' : undefined}
        className="focus-visible:ring-ring/50 flex w-full shrink-0 justify-center rounded-sm focus-visible:ring-[3px] focus-visible:outline-none sm:justify-start"
        onClick={onSelect}
        onDoubleClick={onOpenDay}
        // ポインタ操作の「選択 → ダブルクリックで開く」に対応するキーボード操作。
        // 既定の click を止めてから開くので、選択と遷移が二重に走らない。
        onKeyDown={(keyEvent) => {
          if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return;
          keyEvent.preventDefault();
          onSelect();
          onOpenDay();
        }}
      >
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full text-xs font-medium tabular-nums sm:size-6 sm:text-sm',
            weekdayTextClass(date.getDay()),
            isOutside && 'text-muted-foreground/60',
            isToday && 'bg-primary text-primary-foreground',
          )}
        >
          {date.getDate()}
        </span>
      </button>

      {/* SP のセルは日付とバッジだけにする(デザイン SC-04 SP) */}
      <div className="hidden min-h-0 flex-col gap-0.5 overflow-hidden sm:flex">
        {day?.events.map((event) => {
          const chipText = event.isAllDay
            ? `${event.title} 終日`
            : event.time
              ? `${event.title} ${event.time}`
              : event.title;
          return (
            <button
              key={event.id}
              type="button"
              // 繰り返しの回は同じ文言が何度も並ぶので、日付を足して一意な名前にする
              aria-label={`${formatHeadingDate(date)} ${chipText}`}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/70 focus-visible:ring-ring/50 truncate rounded px-1.5 py-0.5 text-left text-xs font-medium focus-visible:ring-[3px] focus-visible:outline-none"
              onClick={() => onOpenEvent(event)}
            >
              {chipText}
            </button>
          );
        })}
      </div>

      {day && day.badges.length > 0 ? (
        <div className="mt-auto flex flex-wrap items-center justify-center gap-1 sm:justify-start">
          {day.badges.map((badge) => {
            const { icon: BadgeIcon, label } = MODULE_BADGES[badge.moduleKey];
            return (
              <span
                key={badge.moduleKey}
                className="text-muted-foreground flex items-center gap-0.5 text-[0.625rem] font-medium tabular-nums"
                aria-label={`${label} ${badge.count} 件`}
              >
                <BadgeIcon className="size-3" aria-hidden="true" />
                {badge.count}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface DayViewProps {
  date: Date;
  sections: readonly DayEntrySection[];
  isLoading: boolean;
  isError: boolean;
  onOpenEvent: (eventId: string) => void;
}

/** 日表示。時間軸外の「その日の記録」セクションとして一覧する(01_screen_design.md 4 章)。 */
function DayView({ date, sections, isLoading, isError, onOpenEvent }: DayViewProps) {
  if (isError) {
    return <ErrorState title="記録を読み込めませんでした" description={LOAD_ERROR_DESCRIPTION} />;
  }
  if (isLoading) return <Skeleton lineCount={4} hasBlock />;
  if (sections.length === 0) {
    return (
      <EmptyState
        icon={CalendarDaysIcon}
        title={`${formatHeadingDate(date)}の記録はまだありません`}
        description={EMPTY_DAY_DESCRIPTION}
      />
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {sections.map((section) => (
        <section key={section.moduleKey} className="flex flex-col gap-1.5">
          <h2 className="text-muted-foreground text-xs font-medium">{section.label}</h2>
          {section.rows.map((row) =>
            // 予定だけが CAL-11 詳細を持つ。行き先が無い行はボタンにしない
            section.moduleKey === 'calendar' ? (
              <Card key={row.id} isRow onClick={() => onOpenEvent(row.id)}>
                <DayRow row={row} />
              </Card>
            ) : (
              <Card key={row.id} isRow>
                <DayRow row={row} />
              </Card>
            ),
          )}
        </section>
      ))}
    </div>
  );
}

interface DayRowProps {
  row: DayEntrySection['rows'][number];
}

function DayRow({ row }: DayRowProps) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-muted-foreground w-12 shrink-0 font-mono text-xs tabular-nums">
        {row.lead}
      </span>
      <span className="truncate text-sm font-medium">{row.title}</span>
      <span className="text-muted-foreground ml-auto truncate text-xs">{row.sub}</span>
    </div>
  );
}

interface TodayEntryCardProps {
  entry: TodayEntry;
}

function TodayEntryCard({ entry }: TodayEntryCardProps) {
  return (
    <Card isRow>
      <p className="text-muted-foreground text-xs font-medium">{entry.moduleLabel}</p>
      <p className="mt-0.5 line-clamp-2 text-sm font-medium">{entry.title}</p>
      <p className="text-muted-foreground mt-0.5 truncate text-xs">{entry.sub}</p>
    </Card>
  );
}
