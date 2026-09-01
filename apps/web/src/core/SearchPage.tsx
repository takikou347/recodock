import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/icons/Icon';
import { Skeleton } from '../components/Skeleton';
import { findModule } from '../modules/registry';
import { useSearchEntries } from './useSearchEntries';

import layout from './pageLayout.module.css';
import styles from './SearchPage.module.css';

type ModuleFilter = ModuleKey | 'all';

/**
 * SC-07 横断検索。全モジュールの記録を 1 本の入力で横断する。
 * ページがデータ取得を担い、表示は Props で受け取る(コーディング規約 7)。
 */
export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ModuleFilter>('all');
  const { entries, countsByModule, isLoading, isError } = useSearchEntries(query);

  const visibleEntries =
    filter === 'all' ? entries : entries.filter((entry) => entry.moduleKey === filter);

  return (
    <div className={layout.page}>
      <h1 className={layout.titleSm}>横断検索</h1>

      <div className={styles.searchBox}>
        <Icon name="search" size={18} />
        <input
          className={styles.input}
          type="search"
          value={query}
          placeholder="すべての記録を検索"
          aria-label="すべての記録を検索"
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className={styles.meta}>search_entries ビュー · {entries.length} 件</span>
      </div>

      <div className={layout.filters}>
        <Chip isSelected={filter === 'all'} onClick={() => setFilter('all')}>
          すべて
        </Chip>
        {[...countsByModule].map(([moduleKey, count]) => (
          <Chip
            key={moduleKey}
            tone={moduleKey}
            count={count}
            isSelected={filter === moduleKey}
            onClick={() => setFilter(moduleKey)}
          >
            {findModule(moduleKey)?.definition.displayName ?? moduleKey}
          </Chip>
        ))}
      </div>

      {isError ? (
        <ErrorState
          title="検索できませんでした"
          description="接続を確認してもう一度お試しください。"
          onRetry={() => setQuery((current) => current)}
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} hasBlock />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          icon="search"
          title="一致する記録がありません"
          description="キーワードを変えるか、フィルタを外してみてください"
        />
      ) : (
        <div className={styles.results}>
          {visibleEntries.map((entry) => {
            const toneStyle: CSSProperties = {
              '--tone-bg': `var(--color-${entry.moduleKey}-bg)`,
              '--tone-fg': `var(--color-${entry.moduleKey}-fg)`,
            } as CSSProperties;
            return (
              <Card key={entry.id} isRow onClick={() => navigate(entry.href)}>
                <div className={styles.result} style={toneStyle}>
                  <span className={styles.badge}>{entry.moduleLabel}</span>
                  <div className={styles.body}>
                    <p className={styles.title}>{entry.title}</p>
                    <p className={styles.snippet}>{entry.snippet}</p>
                  </div>
                  <span className={styles.date}>{entry.date}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
