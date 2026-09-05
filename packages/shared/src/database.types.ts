// Supabase のスキーマから生成した型定義。手編集しないこと。
//
// 再生成手順(docs/recodock/02_design/03_api_design.md 3 章):
//   1. supabase start(ローカル環境を起動)
//   2. リポジトリルートで `pnpm gen:types`
//   3. 生成結果をコミット
//
// supabase/migrations/*.sql の全テーブル・ビューに対応する。

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          closing_day: number | null;
          created_at: string;
          id: string;
          initial_balance: number;
          is_archived: boolean;
          kind: string;
          ledger_id: string;
          name: string;
          payment_account_id: string | null;
          payment_day: number | null;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          closing_day?: number | null;
          created_at?: string;
          id?: string;
          initial_balance?: number;
          is_archived?: boolean;
          kind: string;
          ledger_id: string;
          name: string;
          payment_account_id?: string | null;
          payment_day?: number | null;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          closing_day?: number | null;
          created_at?: string;
          id?: string;
          initial_balance?: number;
          is_archived?: boolean;
          kind?: string;
          ledger_id?: string;
          name?: string;
          payment_account_id?: string | null;
          payment_day?: number | null;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
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
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          ledger_id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          ledger_id: string;
          month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          ledger_id?: string;
          month?: string;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          id: string;
          is_preset: boolean;
          kind: string;
          ledger_id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_preset?: boolean;
          kind: string;
          ledger_id: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_preset?: boolean;
          kind?: string;
          ledger_id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
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
          body: string;
          created_at: string;
          entry_date: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          mood: string | null;
          spot_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          entry_date: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mood?: string | null;
          spot_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          entry_date?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mood?: string | null;
          spot_id?: string | null;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          diary_id: string;
          id: string;
          sort_order: number;
          storage_path: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          diary_id: string;
          id?: string;
          sort_order?: number;
          storage_path: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          diary_id?: string;
          id?: string;
          sort_order?: number;
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          ends_at: string | null;
          event_id: string;
          id: string;
          is_canceled: boolean;
          location: string | null;
          memo: string | null;
          occurrence_date: string;
          starts_at: string | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          event_id: string;
          id?: string;
          is_canceled?: boolean;
          location?: string | null;
          memo?: string | null;
          occurrence_date: string;
          starts_at?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          event_id?: string;
          id?: string;
          is_canceled?: boolean;
          location?: string | null;
          memo?: string | null;
          occurrence_date?: string;
          starts_at?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          event_id: string;
          id: string;
          minutes_before: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          minutes_before: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          minutes_before?: number;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          ends_at: string;
          id: string;
          is_all_day: boolean;
          location: string | null;
          memo: string | null;
          rrule: string | null;
          rrule_until: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          is_all_day?: boolean;
          location?: string | null;
          memo?: string | null;
          rrule?: string | null;
          rrule_until?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          is_all_day?: boolean;
          location?: string | null;
          memo?: string | null;
          rrule?: string | null;
          rrule_until?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          location: string | null;
          memo: string | null;
          name: string;
          photo_path: string | null;
          price: number | null;
          purchased_on: string | null;
          replace_after: string | null;
          tags: string[];
          updated_at: string;
          user_id: string;
          warranty_expires_on: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          location?: string | null;
          memo?: string | null;
          name: string;
          photo_path?: string | null;
          price?: number | null;
          purchased_on?: string | null;
          replace_after?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id: string;
          warranty_expires_on?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          location?: string | null;
          memo?: string | null;
          name?: string;
          photo_path?: string | null;
          price?: number | null;
          purchased_on?: string | null;
          replace_after?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id?: string;
          warranty_expires_on?: string | null;
        };
        Relationships: [];
      };
      ledger_members: {
        Row: {
          created_at: string;
          id: string;
          ledger_id: string;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ledger_id: string;
          role?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ledger_id?: string;
          role?: string;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_pinned: boolean;
          tags: string[];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          tags?: string[];
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          tags?: string[];
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          last_used_at: string | null;
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          platform: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_used_at?: string | null;
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recurring_rules: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string | null;
          created_at: string;
          day_of_month: number;
          ends_on: string | null;
          id: string;
          kind: string;
          last_recorded_on: string | null;
          ledger_id: string;
          memo: string | null;
          starts_on: string;
          transfer_account_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month: number;
          ends_on?: string | null;
          id?: string;
          kind: string;
          last_recorded_on?: string | null;
          ledger_id: string;
          memo?: string | null;
          starts_on: string;
          transfer_account_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          day_of_month?: number;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          last_recorded_on?: string | null;
          ledger_id?: string;
          memo?: string | null;
          starts_on?: string;
          transfer_account_id?: string | null;
          updated_at?: string;
          user_id?: string;
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
          body: string | null;
          created_at: string;
          id: string;
          notify_at: string;
          sent_at: string | null;
          source_id: string | null;
          source_module: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          notify_at: string;
          sent_at?: string | null;
          source_id?: string | null;
          source_module: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          notify_at?: string;
          sent_at?: string | null;
          source_id?: string | null;
          source_module?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      spots: {
        Row: {
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
          memo: string | null;
          name: string;
          photo_path: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          visited_on: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
          memo?: string | null;
          name: string;
          photo_path?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          visited_on?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          memo?: string | null;
          name?: string;
          photo_path?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          visited_on?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          ledger_id: string;
          memo: string | null;
          occurred_on: string;
          receipt_path: string | null;
          transfer_account_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          ledger_id: string;
          memo?: string | null;
          occurred_on: string;
          receipt_path?: string | null;
          transfer_account_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          ledger_id?: string;
          memo?: string | null;
          occurred_on?: string;
          receipt_path?: string | null;
          transfer_account_id?: string | null;
          updated_at?: string;
          user_id?: string;
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
          created_at: string;
          id: string;
          is_enabled: boolean;
          module_key: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          module_key: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          module_key?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          updated_at: string;
          user_id: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          updated_at?: string;
          user_id: string;
          value: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
          user_id?: string;
          value?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      calendar_entries: {
        Row: {
          entry_date: string | null;
          entry_id: string | null;
          entry_type: string | null;
          module: string | null;
          title: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      map_entries: {
        Row: {
          entry_id: string | null;
          entry_type: string | null;
          latitude: number | null;
          longitude: number | null;
          module: string | null;
          title: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      search_entries: {
        Row: {
          entry_date: string | null;
          entry_id: string | null;
          entry_type: string | null;
          module: string | null;
          searchable_text: string | null;
          title: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
