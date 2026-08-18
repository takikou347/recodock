-- RLS ポリシー(NFR-S3: 本人のデータのみアクセス可を DB 層で強制)
-- 設計: docs/recodock/02_design/05_security_rls.md(develop-docs リポジトリ)
--
-- パターン A: 本人所有(user_id 直接判定)
-- パターン B: 帳簿メンバーシップ経由(家計簿系。Phase 2 共有口座に備える。ADR-0002)

------------------------------------------------------------
-- ヘルパー関数(private スキーマ。PostgREST から直接呼べない)
------------------------------------------------------------

create schema if not exists private;

-- メンバーシップ判定。security definer で ledger_members 自身の RLS との無限再帰を回避
create function private.is_ledger_member(target_ledger uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ledger_members
    where ledger_id = target_ledger
      and user_id = (select auth.uid())
  );
$$;

create function private.is_ledger_owner(target_ledger uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ledger_members
    where ledger_id = target_ledger
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

------------------------------------------------------------
-- パターン A: 本人所有テーブル(全操作: user_id = auth.uid())
------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_modules', 'push_tokens', 'scheduled_notifications', 'user_settings',
    'events', 'event_overrides', 'event_reminders',
    'career_entries', 'career_skills', 'career_projects',
    'spots', 'diaries', 'diary_photos', 'items', 'notes'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select using (user_id = (select auth.uid()))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (user_id = (select auth.uid()))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (user_id = (select auth.uid()))',
      t || '_delete', t
    );
  end loop;
end;
$$;

------------------------------------------------------------
-- パターン B: 帳簿メンバーシップ経由(accounts / categories / budgets / recurring_rules)
------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'categories', 'budgets', 'recurring_rules']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select using (private.is_ledger_member(ledger_id))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (private.is_ledger_member(ledger_id))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (private.is_ledger_member(ledger_id)) with check (private.is_ledger_member(ledger_id))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (private.is_ledger_member(ledger_id))',
      t || '_delete', t
    );
  end loop;
end;
$$;

-- transactions: insert のみ「入力者の詐称防止」を追加(05_security_rls.md 2.1)
alter table public.transactions enable row level security;

create policy transactions_select on public.transactions
  for select using (private.is_ledger_member(ledger_id));

create policy transactions_insert on public.transactions
  for insert with check (
    private.is_ledger_member(ledger_id)
    and user_id = (select auth.uid())
  );

create policy transactions_update on public.transactions
  for update
  using (private.is_ledger_member(ledger_id))
  with check (private.is_ledger_member(ledger_id));

create policy transactions_delete on public.transactions
  for delete using (private.is_ledger_member(ledger_id));

-- ledgers: select はメンバー、insert は作成者本人、update / delete は owner のみ
alter table public.ledgers enable row level security;

create policy ledgers_select on public.ledgers
  for select using (private.is_ledger_member(id));

create policy ledgers_insert on public.ledgers
  for insert with check (user_id = (select auth.uid()));

create policy ledgers_update on public.ledgers
  for update
  using (private.is_ledger_owner(id))
  with check (private.is_ledger_owner(id));

create policy ledgers_delete on public.ledgers
  for delete using (private.is_ledger_owner(id));

-- ledger_members: select は同一帳簿メンバー、変更は owner のみ(Phase 2 の招待操作)
alter table public.ledger_members enable row level security;

create policy ledger_members_select on public.ledger_members
  for select using (private.is_ledger_member(ledger_id));

create policy ledger_members_insert on public.ledger_members
  for insert with check (private.is_ledger_owner(ledger_id));

create policy ledger_members_update on public.ledger_members
  for update
  using (private.is_ledger_owner(ledger_id))
  with check (private.is_ledger_owner(ledger_id));

create policy ledger_members_delete on public.ledger_members
  for delete using (private.is_ledger_owner(ledger_id));

------------------------------------------------------------
-- anon には一切の権限を与えない(05_security_rls.md 2.2)
------------------------------------------------------------

revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

------------------------------------------------------------
-- Storage(FR-09, NFR-S4)。バケットは private、パス先頭がアクセス判定キー
--   receipts:     <ledger_id>/...(帳簿所有。Phase 2 共有に備える)
--   diary-photos: <user_id>/...
--   item-photos:  <user_id>/...
------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('diary-photos', 'diary-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('item-photos', 'item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- 本人所有バケット
create policy diary_photos_rw on storage.objects
  for all
  using (
    bucket_id = 'diary-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'diary-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy item_photos_rw on storage.objects
  for all
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 帳簿所有バケット(receipts)
create policy receipts_rw on storage.objects
  for all
  using (
    bucket_id = 'receipts'
    and private.is_ledger_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'receipts'
    and private.is_ledger_member(((storage.foldername(name))[1])::uuid)
  );
