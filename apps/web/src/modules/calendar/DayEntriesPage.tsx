import type { CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';
import { formatHeadingDate } from '@recodock/shared';

import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/icons/Icon';
import { Skeleton } from '../../components/Skeleton';
import { useDayEntries } from './useCalendarEntries';

import layout from '../../core/pageLayout.module.css';
import styles from './DayEntriesPage.module.css';

function toneStyle(moduleKey: ModuleKey): CSSProperties {
  return { '--tone-solid': `var(--color-${moduleKey}-solid)` } as CSSProperties;
}

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
    <div className={layout.page}>
      <button type="button" className={styles.back} onClick={() => navigate('/')}>
        <Icon name="chevronLeft" size={16} />
        {date.getMonth() + 1}月
      </button>

      <div>
        <h1 className={layout.title}>{formatHeadingDate(date)}</h1>
        <div className={styles.summary}>
          {sections.map((section) => (
            <Chip
              key={section.moduleKey}
              tone={section.moduleKey}
              isSelected
              size="sm"
              count={section.rows.length}
            >
              {section.label.split(' · ')[0]}
            </Chip>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="記録を読み込めませんでした"
          description="記録は端末に保存済み。接続を確認してください。"
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : sections.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="この日の記録はまだありません"
          description="カレンダーの ＋ から予定や記録を追加できます"
        />
      ) : (
        <div className={styles.sections}>
          {sections.map((section) => (
            <section
              key={section.moduleKey}
              className={styles.section}
              style={toneStyle(section.moduleKey)}
            >
              <div className={styles.sectionHead}>
                <span className={styles.sectionDot} />
                <h2 className={styles.sectionLabel}>{section.label}</h2>
              </div>
              {section.rows.map((row) => (
                <Card key={row.id} isRow onClick={() => undefined}>
                  <div className={styles.row}>
                    <span className={styles.lead}>{row.lead}</span>
                    <div className={styles.rowBody}>
                      <p className={styles.rowTitle}>{row.title}</p>
                      <p className={styles.rowSub}>{row.sub}</p>
                    </div>
                    <span className={styles.chevron}>
                      <Icon name="chevronRight" size={14} />
                    </span>
                  </div>
                </Card>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
