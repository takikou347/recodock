import type {
  CalendarEntryRecord,
  CalendarEventRecord,
  DiaryRecord,
  ItemRecord,
  NoteRecord,
  SearchEntryRecord,
  SpotRecord,
  TransactionRecord,
  UserModule,
} from '@recodock/shared';

/** テストで使うログイン済みユーザー。 */
export const TEST_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'kota@example.com',
  displayName: '瀧川皓太',
};

export const userModules: UserModule[] = [
  { moduleKey: 'calendar', isEnabled: true, sortOrder: 0 },
  { moduleKey: 'money', isEnabled: true, sortOrder: 1 },
  { moduleKey: 'diary', isEnabled: true, sortOrder: 2 },
  { moduleKey: 'map', isEnabled: true, sortOrder: 3 },
];

export const events: CalendarEventRecord[] = [
  {
    id: 'event-1',
    title: '散歩',
    startsAt: '2026-08-22T08:00:00.000Z',
    endsAt: '2026-08-22T09:00:00.000Z',
    isAllDay: false,
    location: '鴨川 三条',
    memo: null,
    rrule: null,
    rruleUntil: null,
  },
];

export const calendarEntries: CalendarEntryRecord[] = [
  {
    moduleKey: 'calendar',
    entryType: 'event',
    entryId: 'event-1',
    entryDate: '2026-08-22',
    title: '散歩',
  },
  {
    moduleKey: 'money',
    entryType: 'transaction',
    entryId: 'tx-1',
    entryDate: '2026-08-22',
    title: 'スーパーで買い物',
  },
  {
    moduleKey: 'diary',
    entryType: 'diary',
    entryId: 'diary-1',
    entryDate: '2026-08-22',
    title: '夏のはじまり、川沿いを歩いた',
  },
];

export const transactions: TransactionRecord[] = [
  {
    id: 'tx-1',
    kind: 'expense',
    amount: 1280,
    occurredOn: '2026-08-22',
    accountId: 'account-1',
    transferAccountId: null,
    categoryId: 'category-food',
    memo: 'スーパーで買い物',
  },
  {
    id: 'tx-2',
    kind: 'income',
    amount: 280000,
    occurredOn: '2026-08-19',
    accountId: 'account-1',
    transferAccountId: null,
    categoryId: 'category-salary',
    memo: '8月分 給与',
  },
];

export const diaries: DiaryRecord[] = [
  {
    id: 'diary-1',
    entryDate: '2026-08-21',
    body: '夏のはじまり、川沿いを歩いた\n\n夕方から鴨川沿いを 1 時間ほど歩いた。',
    mood: 'great',
    latitude: 35.0092,
    longitude: 135.7727,
    spotId: null,
    updatedAt: '2026-08-21T10:42:00.000Z',
  },
];

export const items: ItemRecord[] = [
  {
    id: 'item-1',
    name: '加湿器',
    category: '家電',
    tags: [],
    purchasedOn: '2026-01-10',
    price: 12000,
    location: '押入れ',
    warrantyExpiresOn: '2027-01-10',
    memo: null,
  },
];

export const notes: NoteRecord[] = [
  {
    id: 'note-1',
    title: '鴨川で読む本リスト',
    body: '積読の消化\n文庫を2冊持っていく',
    tags: [],
    isPinned: true,
    updatedAt: '2026-08-18T02:00:00.000Z',
  },
  {
    id: 'note-2',
    title: '買い物メモ',
    body: '洗剤・コーヒー豆・電池',
    tags: [],
    isPinned: false,
    updatedAt: '2026-08-15T02:00:00.000Z',
  },
];

export const spots: SpotRecord[] = [
  {
    id: 'spot-1',
    name: '鴨川 三条',
    latitude: 35.0092,
    longitude: 135.7727,
    status: 'visited',
    visitedOn: '2026-08-21',
    memo: null,
  },
];

export const searchEntries: SearchEntryRecord[] = [
  {
    moduleKey: 'diary',
    entryType: 'diary',
    entryId: 'diary-1',
    entryDate: '2026-08-21',
    title: '夏のはじまり、川沿いを歩いた',
    searchableText: '夕方から鴨川沿いを1時間ほど歩いた',
  },
  {
    moduleKey: 'map',
    entryType: 'spot',
    entryId: 'spot-1',
    entryDate: '2026-08-21',
    title: '鴨川 三条',
    searchableText: '鴨川 三条 訪問済み',
  },
  {
    moduleKey: 'notes',
    entryType: 'note',
    entryId: 'note-1',
    entryDate: '2026-08-18',
    title: '鴨川で読む本リスト',
    searchableText: '積読の消化 文庫を2冊',
  },
];

export const accounts = [
  {
    id: 'account-1',
    name: '三菱UFJ',
    kind: 'bank' as const,
    initialBalance: 100000,
    isArchived: false,
  },
  // 振替には出金元と入金先の 2 口座が要る
  {
    id: 'account-2',
    name: '現金',
    kind: 'cash' as const,
    initialBalance: 20000,
    isArchived: false,
  },
];

export const categories = [
  { id: 'category-food', name: '食費', kind: 'expense' as const, sortOrder: 0 },
  { id: 'category-salary', name: '給与', kind: 'income' as const, sortOrder: 1 },
];

export const budgets = [{ id: 'budget-1', month: '2026-08-01', categoryId: null, amount: 250000 }];
