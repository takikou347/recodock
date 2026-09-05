// TanStack Query のキーファクトリ(コーディング規約 5)。
// UI からは必ずここを経由し、文字列リテラルを直接書かない。
// 形式: [module, resource, ...params]

/** 月キー(YYYY-MM)。月次のクエリを月単位でキャッシュするために使う。 */
export type MonthKey = string;

export const queryKeys = {
  core: {
    userModules: () => ['core', 'userModules'] as const,
    search: (keyword: string) => ['core', 'search', keyword] as const,
    calendarEntries: (month: MonthKey) => ['core', 'calendarEntries', month] as const,
    dayEntries: (date: string) => ['core', 'dayEntries', date] as const,
  },
  calendar: {
    events: (month: MonthKey) => ['calendar', 'events', month] as const,
    event: (eventId: string) => ['calendar', 'event', eventId] as const,
  },
  money: {
    ledger: () => ['money', 'ledger'] as const,
    transactions: (month: MonthKey) => ['money', 'transactions', month] as const,
    summary: (month: MonthKey) => ['money', 'summary', month] as const,
    accounts: () => ['money', 'accounts'] as const,
    categories: () => ['money', 'categories'] as const,
    budgets: (month: MonthKey) => ['money', 'budgets', month] as const,
  },
  diary: {
    list: (keyword: string) => ['diary', 'list', keyword] as const,
    detail: (diaryId: string) => ['diary', 'detail', diaryId] as const,
    photos: (diaryId: string) => ['diary', 'photos', diaryId] as const,
  },
  items: {
    list: (category: string) => ['items', 'list', category] as const,
  },
  notes: {
    list: () => ['notes', 'list'] as const,
  },
  map: {
    spots: (status: string) => ['map', 'spots', status] as const,
  },
} as const;
