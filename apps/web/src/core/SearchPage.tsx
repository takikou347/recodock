import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ModuleKey } from '@recodock/shared';

import { useSearchEntries } from './useSearchEntries';

import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Page, PageHeader, PageToolbar } from '@/core/PageLayout';
import { findModule } from '@/modules/registry';

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
    <Page>
      <PageHeader title="横断検索" meta={query ? `${entries.length} 件` : undefined} />

      <SearchField
        value={query}
        onValueChange={setQuery}
        ariaLabel="すべての記録を検索"
        placeholder="すべての記録を検索"
        className="max-w-xl"
      />

      {countsByModule.size > 0 ? (
        <PageToolbar role="group" aria-label="モジュールで絞り込み">
          <Chip isSelected={filter === 'all'} onClick={() => setFilter('all')}>
            すべて
          </Chip>
          {[...countsByModule].map(([moduleKey, count]) => (
            <Chip
              key={moduleKey}
              count={count}
              isSelected={filter === moduleKey}
              onClick={() => setFilter(moduleKey)}
            >
              {findModule(moduleKey)?.definition.displayName ?? moduleKey}
            </Chip>
          ))}
        </PageToolbar>
      ) : null}

      {isError ? (
        <ErrorState
          title="検索できませんでした"
          description="通信を確認してもう一度お試しください。"
          onRetry={() => setQuery((current) => current)}
        />
      ) : isLoading ? (
        <Skeleton lineCount={4} />
      ) : query.trim() === '' ? (
        <EmptyState
          icon={SearchIcon}
          title="キーワードを入れて検索"
          description="予定・収支・日記・持ち物・メモ・スポットをまとめて探せます"
        />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="一致する記録がありません"
          description="キーワードを変えるか、フィルタを外してみてください"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleEntries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="bg-card hover:bg-muted/50 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                onClick={() => navigate(entry.href)}
              >
                <Badge variant="outline" className="shrink-0">
                  {entry.moduleLabel}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="text-muted-foreground truncate text-xs">{entry.snippet}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {entry.date}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
