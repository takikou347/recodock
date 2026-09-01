import { useQuery } from '@tanstack/react-query';

import type { ModuleKey } from '@recodock/shared';
import { entriesRepo, queryKeys } from '@recodock/shared';

import { monthGridRange, toMonthKey } from '../lib/monthRange';
import { supabase } from '../lib/supabase';

/**
 * サイドバーに出すモジュール別の記録件数。
 * calendar_entries ビューを今月ぶん引いて集計する(CAL-04 と同じ集約)。
 */
export function useModuleEntryCounts(): ReadonlyMap<ModuleKey, number> {
  const month = new Date();
  const range = monthGridRange(month);

  const query = useQuery({
    queryKey: queryKeys.core.calendarEntries(toMonthKey(month)),
    queryFn: () => entriesRepo.listCalendarEntries(supabase, range.from, range.to),
  });

  const counts = new Map<ModuleKey, number>();
  for (const entry of query.data ?? []) {
    counts.set(entry.moduleKey, (counts.get(entry.moduleKey) ?? 0) + 1);
  }
  return counts;
}
