// Supabase のスキーマから自動生成される型定義。
//
// 再生成手順(docs/recodock/02_design/03_api_design.md 3 章):
//   1. supabase start(ローカル環境を起動)
//   2. リポジトリルートで `pnpm gen:types`
//   3. 生成結果をコミット(CI がマイグレーションとの乖離を検出する)
//
// 以下はマイグレーション 0001 のうち user_modules のみを手書きしたプレースホルダ。
// ローカル環境を初回起動したら必ず gen:types で全テーブル分に置き換えること。

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_modules: {
        Row: {
          id: string;
          user_id: string;
          module_key: string;
          is_enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_key: string;
          is_enabled?: boolean;
          sort_order?: number;
        };
        Update: {
          is_enabled?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
