// @recodock/shared のパブリック API。
// UI(apps/web, apps/mobile)はこのエントリポイント経由でのみ shared を参照する。

export * as authRepo from './data/auth';
export * as diariesRepo from './data/diaries';
export * as entriesRepo from './data/entries';
export { AppError, type AppErrorCode, toAppError } from './data/errors';
export * as eventsRepo from './data/events';
export * as itemsRepo from './data/items';
export * as moneyRepo from './data/money';
export * as notesRepo from './data/notes';
export { queryKeys } from './data/queryKeys';
export * as spotsRepo from './data/spots';
export * as userModulesRepo from './data/userModules';
export * as userSettingsRepo from './data/userSettings';
export * from './domain/format';
export * from './domain/money';
export * from './domain/recurrence';
export * from './modules/types';
export { createSupabaseClient, type RecodockClient } from './supabase/client';

// リポジトリ関数が返すドメイン型(UI が Props に使う)
export type { AuthUser } from './data/auth';
export type { DiaryMood, DiaryPhotoRecord, DiaryRecord, UpsertDiaryInput } from './data/diaries';
export type { CalendarEntryRecord, MapEntryRecord, SearchEntryRecord } from './data/entries';
export type { CalendarEventRecord, CreateEventInput } from './data/events';
export type { CreateItemInput, ItemRecord } from './data/items';
export type {
  AccountRecord,
  BudgetRecord,
  CategoryRecord,
  CreateTransactionInput,
  LedgerRecord,
  TransactionRecord,
} from './data/money';
export type { NoteRecord, UpsertNoteInput } from './data/notes';
export type { CreateSpotInput, SpotRecord, SpotStatus } from './data/spots';
export type { UserModule } from './data/userModules';
export type { UserSettingKey } from './data/userSettings';
