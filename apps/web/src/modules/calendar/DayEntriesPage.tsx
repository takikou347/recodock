import { CalendarDaysIcon, ChevronLeftIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatHeadingDate } from '@recodock/shared';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Page, PageHeader, PageToolbar } from '@/core/PageLayout';
import { useDayEntries } from '@/modules/calendar/useCalendarEntries';

/** URL の :date(YYYY-MM-DD)を Date にする。不正な値は今日として扱う。 */
function parseDateParam(value: string | undefined): Date {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * CAL-13 日別記録一覧。カレンダーの日付セルから遷移し、その日の全モジュールの記録を見る。
 */
export function DayEntriesPage() {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();
  const date = parseDateParam(dateParam);
  const { sections, isLoading, isError } = useDayEntries(date);

  return (
    <Page>
      <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={() => navigate('/')}>
        <ChevronLeftIcon />
        {date.getMonth() + 1}月
      </Button>

      <PageHeader title={formatHeadingDate(date)} />

      {sections.length > 0 ? (
        <PageToolbar>
          {/* 件数の内訳を見せるだけで絞り込みはしないので、押せる Chip ではなく Badge にする */}
          {sections.map((section) => (
            <Badge key={section.moduleKey} variant="secondary">
              {section.label.split(' · ')[0]}
              <span className="tabular-nums opacity-70">{section.rows.length}</span>
            </Badge>
          ))}
        </PageToolbar>
      ) : null}

      {isError ? (
        <ErrorState
          title="記録を読み込めませんでした"
          description="通信を確認してもう一度お試しください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title="この日の記録はまだありません"
          description="カレンダーの ＋ から予定や記録を追加できます"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <section key={section.moduleKey} className="flex flex-col gap-1.5">
              <h2 className="text-muted-foreground px-1 text-xs font-medium">{section.label}</h2>
              {section.rows.map((row) => (
                // 行き先のある詳細画面がまだ無いので、押せる見た目にはしない(空振りのボタンを作らない)
                <Card key={row.id} isRow>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-12 shrink-0 font-mono text-xs tabular-nums">
                      {row.lead}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="text-muted-foreground truncate text-xs">{row.sub}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
