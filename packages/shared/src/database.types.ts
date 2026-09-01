// Supabase のスキーマから生成した型定義。手編集しないこと。
//
// 再生成手順(docs/recodock/02_design/03_api_design.md 3 章):
//   1. supabase start(ローカル環境を起動)
//   2. リポジトリルートで `pnpm gen:types`
//   3. 生成結果をコミット
//
// supabase/migrations/*.sql の全テーブル・ビューに対応する。

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          name: string;
          kind: string;
          initial_balance: number;
          closing_day: number | null;
          payment_day: number | null;
          payment_account_id: string | null;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          name: string;
          kind: string;
          initial_balance?: number;
          closing_day?: number | null;
          payment_day?: number | null;
          payment_account_id?: string | null;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          name?: string;
          kind?: string;
          initial_balance?: number;
          closing_day?: number | null;
          payment_day?: number | null;
          payment_account_id?: string | null;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'accounts_payment_account_id_fkey';
            columns: ['payment_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          month: string;
          category_id: string | null;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          month: string;
          category_id?: string | null;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          month?: string;
          category_id?: string | null;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budgets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budgets_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          name: string;
          kind: string;
          is_preset: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          name: string;
          kind: string;
          is_preset?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          name?: string;
          kind?: string;
          is_preset?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
        ];
      };
      diaries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          body: string;
          mood: string | null;
          latitude: number | null;
          longitude: number | null;
          spot_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          body: string;
          mood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          spot_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          body?: string;
          mood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          spot_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'diaries_spot_id_fkey';
            columns: ['spot_id'];
            isOneToOne: false;
            referencedRelation: 'spots';
            referencedColumns: ['id'];
          },
        ];
      };
      diary_photos: {
        Row: {
          id: string;
          user_id: string;
          diary_id: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          diary_id: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          diary_id?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'diary_photos_diary_id_fkey';
            columns: ['diary_id'];
            isOneToOne: false;
            referencedRelation: 'diaries';
            referencedColumns: ['id'];
          },
        ];
      };
      event_overrides: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          occurrence_date: string;
          is_canceled: boolean;
          title: string | null;
          starts_at: string | null;
          ends_at: string | null;
          location: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          occurrence_date: string;
          is_canceled?: boolean;
          title?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          location?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          occurrence_date?: string;
          is_canceled?: boolean;
          title?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          location?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_overrides_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_reminders: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          minutes_before: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          minutes_before: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          minutes_before?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_reminders_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          is_all_day: boolean;
          location: string | null;
          memo: string | null;
          rrule: string | null;
          rrule_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          is_all_day?: boolean;
          location?: string | null;
          memo?: string | null;
          rrule?: string | null;
          rrule_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          starts_at?: string;
          ends_at?: string;
          is_all_day?: boolean;
          location?: string | null;
          memo?: string | null;
          rrule?: string | null;
          rrule_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          tags: string[];
          purchased_on: string | null;
          price: number | null;
          photo_path: string | null;
          location: string | null;
          warranty_expires_on: string | null;
          replace_after: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          tags?: string[];
          purchased_on?: string | null;
          price?: number | null;
          photo_path?: string | null;
          location?: string | null;
          warranty_expires_on?: string | null;
          replace_after?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          tags?: string[];
          purchased_on?: string | null;
          price?: number | null;
          photo_path?: string | null;
          location?: string | null;
          warranty_expires_on?: string | null;
          replace_after?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ledger_members: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ledger_members_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
        ];
      };
      ledgers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          tags: string[];
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          body?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          token: string;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          token: string;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string;
          token?: string;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_rules: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          kind: string;
          amount: number;
          account_id: string;
          transfer_account_id: string | null;
          category_id: string | null;
          memo: string | null;
          day_of_month: number;
          starts_on: string;
          ends_on: string | null;
          last_recorded_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          kind: string;
          amount: number;
          account_id: string;
          transfer_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          day_of_month: number;
          starts_on: string;
          ends_on?: string | null;
          last_recorded_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          kind?: string;
          amount?: number;
          account_id?: string;
          transfer_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          day_of_month?: number;
          starts_on?: string;
          ends_on?: string | null;
          last_recorded_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_rules_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_rules_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_rules_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_rules_transfer_account_id_fkey';
            columns: ['transfer_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          notify_at: string;
          title: string;
          body: string | null;
          source_module: string;
          source_id: string | null;
          status: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notify_at: string;
          title: string;
          body?: string | null;
          source_module: string;
          source_id?: string | null;
          status?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notify_at?: string;
          title?: string;
          body?: string | null;
          source_module?: string;
          source_id?: string | null;
          status?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spots: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          latitude: number;
          longitude: number;
          status: string;
          visited_on: string | null;
          memo: string | null;
          photo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          latitude: number;
          longitude: number;
          status?: string;
          visited_on?: string | null;
          memo?: string | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          status?: string;
          visited_on?: string | null;
          memo?: string | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          ledger_id: string;
          kind: string;
          amount: number;
          occurred_on: string;
          account_id: string;
          transfer_account_id: string | null;
          category_id: string | null;
          memo: string | null;
          receipt_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ledger_id: string;
          kind: string;
          amount: number;
          occurred_on: string;
          account_id: string;
          transfer_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ledger_id?: string;
          kind?: string;
          amount?: number;
          occurred_on?: string;
          account_id?: string;
          transfer_account_id?: string | null;
          category_id?: string | null;
          memo?: string | null;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_ledger_id_fkey';
            columns: ['ledger_id'];
            isOneToOne: false;
            referencedRelation: 'ledgers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_transfer_account_id_fkey';
            columns: ['transfer_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
        ];
      };
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_key?: string;
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      calendar_entries: {
        Row: {
          module: string | null;
          entry_type: string | null;
          entry_id: string | null;
          user_id: string | null;
          entry_date: string | null;
          title: string | null;
        };
        Relationships: [];
      };
      map_entries: {
        Row: {
          module: string | null;
          entry_type: string | null;
          entry_id: string | null;
          user_id: string | null;
          latitude: number | null;
          longitude: number | null;
          title: string | null;
        };
        Relationships: [];
      };
      search_entries: {
        Row: {
          module: string | null;
          entry_type: string | null;
          entry_id: string | null;
          user_id: string | null;
          entry_date: string | null;
          title: string | null;
          searchable_text: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** テーブル/ビューの行型を引くヘルパー(生成物の慣習に合わせる)。 */
export type Tables<T extends keyof (Database['public']['Tables'] & Database['public']['Views'])> =
  (Database['public']['Tables'] & Database['public']['Views'])[T] extends { Row: infer R }
    ? R
    : never;

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
