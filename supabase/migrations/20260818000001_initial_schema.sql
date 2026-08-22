-- Recodock 初期スキーマ
-- 設計: docs/recodock/02_design/02_data_model.md(develop-docs リポジトリ)
-- 共通カラム規約(1.1): id / user_id / created_at / updated_at を全テーブルに持つ(NFR-E2)

create extension if not exists pg_trgm;

-- updated_at 自動更新トリガー関数
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

------------------------------------------------------------
-- コア(3.1)
------------------------------------------------------------

-- モジュール有効状態(CORE-02, FR-01)
create table public.user_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_key text not null check (
    module_key in ('calendar', 'money', 'diary', 'items', 'notes', 'map')
  ),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);

-- 通知先デバイス(CORE-04, FR-06)
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'web')),
  token text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

-- 通知予約キュー(CAL-03, ITM-03, CORE-04)
create table public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notify_at timestamptz not null,
  title text not null,
  body text,
  source_module text not null,
  source_id uuid,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'canceled')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- schedule-reminders の二重予約を防ぐ冪等性キー(03_api_design.md 2 章)
  unique (user_id, source_module, source_id, notify_at)
);

create index scheduled_notifications_status_notify_at_idx
  on public.scheduled_notifications (status, notify_at);

-- ユーザー設定(NFR-S6 ほか)
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

------------------------------------------------------------
-- Reco Calendar(3.2)
------------------------------------------------------------

-- 予定(CAL-01)。繰り返しは RRULE 文字列で保持しクライアント側で展開
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  location text,
  memo text,
  rrule text,
  rrule_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index events_user_starts_at_idx on public.events (user_id, starts_at);
create index events_user_rrule_until_idx on public.events (user_id, rrule_until);

-- 繰り返しの例外(CAL-01。EXDATE / RECURRENCE-ID 相当)
create table public.event_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  occurrence_date timestamptz not null,
  is_canceled boolean not null default false,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, occurrence_date)
);

-- リマインド設定(CAL-03)
create table public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  minutes_before integer not null check (minutes_before >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, minutes_before)
);

------------------------------------------------------------
-- Reco Money(3.3)— 帳簿方式(1.4, ADR-0002)
------------------------------------------------------------

-- 帳簿(FR-11, MON-10)。user_id は作成者。アクセス可否は ledger_members で判定
create table public.ledgers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 帳簿メンバーシップ(MON-10, NFR-E2)
create table public.ledger_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ledger_id, user_id)
);

create index ledger_members_user_idx on public.ledger_members (user_id);

-- 口座(MON-02)。残高カラムは持たず initial_balance + 取引集計で導出
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash', 'bank', 'credit_card', 'emoney')),
  initial_balance numeric(12, 0) not null default 0,
  closing_day integer check (closing_day between 1 and 31),
  payment_day integer check (payment_day between 1 and 31),
  payment_account_id uuid references public.accounts (id),
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_ledger_idx on public.accounts (ledger_id);

-- カテゴリ(MON-03)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  is_preset boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_ledger_idx on public.categories (ledger_id);

-- 取引(MON-01, MON-05, FR-11, ADR-0003)。収入/支出/振替を単一テーブルで表現
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  amount numeric(12, 0) not null check (amount > 0),
  occurred_on date not null,
  account_id uuid not null references public.accounts (id),
  transfer_account_id uuid references public.accounts (id),
  category_id uuid references public.categories (id),
  memo text,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 振替のみ transfer_account_id 必須、かつ自分自身への振替は禁止
  check ((kind = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  -- 振替はカテゴリを持たない = 収支に計上しない(MON-05)
  check (kind <> 'transfer' or category_id is null)
);

create index transactions_ledger_occurred_idx on public.transactions (ledger_id, occurred_on);
create index transactions_ledger_account_idx on public.transactions (ledger_id, account_id);
create index transactions_ledger_category_idx on public.transactions (ledger_id, category_id);

-- 予算(MON-06)
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  category_id uuid references public.categories (id) on delete cascade,
  amount numeric(12, 0) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (ledger_id, month, category_id)
);

-- 定期収支ルール(MON-09)。record-recurring 関数が評価して transactions に自動記録
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  amount numeric(12, 0) not null check (amount > 0),
  account_id uuid not null references public.accounts (id),
  transfer_account_id uuid references public.accounts (id),
  category_id uuid references public.categories (id),
  memo text,
  day_of_month integer not null check (day_of_month between 1 and 31),
  starts_on date not null,
  ends_on date,
  last_recorded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  check (kind <> 'transfer' or category_id is null)
);

------------------------------------------------------------
-- Reco Map(3.7)※ diaries が spot_id で参照するため先に作成
------------------------------------------------------------

-- 訪問記録・行きたい場所(MAP-01, MAP-04)
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'visited' check (status in ('visited', 'wishlist')),
  visited_on date,
  memo text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spots_user_status_idx on public.spots (user_id, status);
create index spots_user_coord_idx on public.spots (user_id, latitude, longitude);

------------------------------------------------------------
-- Reco Diary(3.4)
------------------------------------------------------------

-- 日記(DIA-01)。1日1件以上のため entry_date は UNIQUE にしない
create table public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  body text not null,
  mood text check (mood in ('great', 'good', 'normal', 'bad', 'awful')),
  latitude double precision,
  longitude double precision,
  spot_id uuid references public.spots (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 位置情報は両方 NULL か両方 NOT NULL
  check ((latitude is null) = (longitude is null))
);

create index diaries_user_entry_date_idx on public.diaries (user_id, entry_date);

-- 日記写真(DIA-02, FR-09)
create table public.diary_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  diary_id uuid not null references public.diaries (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- Reco Items(3.5)
------------------------------------------------------------

-- 持ち物(ITM-01)。warranty_expires_on / replace_after は期限通知(ITM-03)の対象
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  tags text[] not null default '{}',
  purchased_on date,
  price numeric(12, 0) check (price >= 0),
  photo_path text,
  location text,
  warranty_expires_on date,
  replace_after date,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_user_name_idx on public.items (user_id, name);
create index items_tags_idx on public.items using gin (tags);

------------------------------------------------------------
-- Reco Notes(3.6)
------------------------------------------------------------

-- メモ(MEM-01)。チェックリスト(MEM-03)は Markdown の `- [ ]` 記法で表現
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_pinned_updated_idx on public.notes (user_id, is_pinned, updated_at);
create index notes_tags_idx on public.notes using gin (tags);

------------------------------------------------------------
-- updated_at トリガーを全テーブルに適用
------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_modules', 'push_tokens', 'scheduled_notifications', 'user_settings',
    'events', 'event_overrides', 'event_reminders',
    'ledgers', 'ledger_members', 'accounts', 'categories', 'transactions', 'budgets', 'recurring_rules',
    'spots', 'diaries', 'diary_photos', 'items', 'notes'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

------------------------------------------------------------
-- ユーザー作成時の初期データ(02_data_model.md 4 章)
-- 帳簿・プリセットカテゴリ・user_modules を自動生成する
------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_ledger_id uuid;
  module_key text;
  idx integer := 0;
begin
  -- 全モジュールを有効状態で登録(CORE-02)
  foreach module_key in array array['calendar', 'money', 'diary', 'items', 'notes', 'map']
  loop
    insert into public.user_modules (user_id, module_key, is_enabled, sort_order)
    values (new.id, module_key, true, idx);
    idx := idx + 1;
  end loop;

  -- メイン帳簿とオーナーメンバーシップ(ADR-0002)
  insert into public.ledgers (user_id, name)
  values (new.id, 'メイン')
  returning id into new_ledger_id;

  insert into public.ledger_members (user_id, ledger_id, role)
  values (new.id, new_ledger_id, 'owner');

  -- プリセットカテゴリ(MON-03)
  insert into public.categories (user_id, ledger_id, name, kind, is_preset, sort_order)
  values
    (new.id, new_ledger_id, '食費', 'expense', true, 0),
    (new.id, new_ledger_id, '日用品', 'expense', true, 1),
    (new.id, new_ledger_id, '交通費', 'expense', true, 2),
    (new.id, new_ledger_id, '住居費', 'expense', true, 3),
    (new.id, new_ledger_id, '光熱費', 'expense', true, 4),
    (new.id, new_ledger_id, '通信費', 'expense', true, 5),
    (new.id, new_ledger_id, '交際費', 'expense', true, 6),
    (new.id, new_ledger_id, '趣味・娯楽', 'expense', true, 7),
    (new.id, new_ledger_id, '医療費', 'expense', true, 8),
    (new.id, new_ledger_id, 'その他支出', 'expense', true, 9),
    (new.id, new_ledger_id, '給与', 'income', true, 0),
    (new.id, new_ledger_id, '賞与', 'income', true, 1),
    (new.id, new_ledger_id, 'その他収入', 'income', true, 2);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
