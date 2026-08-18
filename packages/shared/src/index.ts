// @recodock/shared のパブリック API。
// UI(apps/web, apps/mobile)はこのエントリポイント経由でのみ shared を参照する。

export * from './modules/types';
export * from './domain/money';
export { createSupabaseClient, type RecodockClient } from './supabase/client';
export * as userModulesRepo from './data/userModules';
