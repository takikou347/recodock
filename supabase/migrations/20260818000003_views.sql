-- 集約ビュー(FR-04, CAL-04, MAP-03, CORE-06)
-- 設計: docs/recodock/02_design/02_data_model.md 3.9 / 3.10
-- security_invoker = true により基底テーブルの RLS がそのまま適用される。
-- 新モジュール追加時は各ビューに UNION を1本足す(FR-02)。

-- カレンダー集約(3.9)。繰り返し予定(rrule あり)は含めず、クライアント側の展開結果を重ねる。
-- 日付判定のタイムゾーンは Asia/Tokyo 固定。
create view public.calendar_entries
  with (security_invoker = true) as
select 'calendar' as module, 'event' as entry_type, id as entry_id,
       user_id, (starts_at at time zone 'Asia/Tokyo')::date as entry_date, title
  from public.events
 where rrule is null
union all
select 'money', 'transaction', t.id, t.user_id, t.occurred_on, coalesce(t.memo, c.name, '取引')
  from public.transactions t
  left join public.categories c on c.id = t.category_id
union all
select 'diary', 'diary', id, user_id, entry_date, left(body, 30)
  from public.diaries
union all
select 'items', 'item', id, user_id, purchased_on, name
  from public.items
 where purchased_on is not null
union all
select 'map', 'spot', id, user_id, visited_on, name
  from public.spots
 where visited_on is not null;

-- 地図集約(MAP-03)。位置情報を持つ記録を1枚の地図に重ねる
create view public.map_entries
  with (security_invoker = true) as
select 'map' as module, 'spot' as entry_type, id as entry_id,
       user_id, latitude, longitude, name as title
  from public.spots
union all
select 'diary', 'diary', id, user_id, latitude, longitude, left(body, 30)
  from public.diaries
 where latitude is not null;

-- 横断検索(CORE-06)。pg_trgm + ILIKE の部分一致検索の対象(3.10)
create view public.search_entries
  with (security_invoker = true) as
select 'calendar' as module, 'event' as entry_type, id as entry_id, user_id,
       (starts_at at time zone 'Asia/Tokyo')::date as entry_date,
       title, concat_ws(' ', title, location, memo) as searchable_text
  from public.events
union all
select 'money', 'transaction', id, user_id, occurred_on, coalesce(memo, '取引'), coalesce(memo, '')
  from public.transactions
union all
select 'diary', 'diary', id, user_id, entry_date, left(body, 30), body
  from public.diaries
union all
select 'items', 'item', id, user_id, purchased_on, name,
       concat_ws(' ', name, category, location, memo)
  from public.items
union all
select 'notes', 'note', id, user_id, (updated_at at time zone 'Asia/Tokyo')::date, title,
       concat_ws(' ', title, body)
  from public.notes
union all
select 'map', 'spot', id, user_id, visited_on, name, concat_ws(' ', name, memo)
  from public.spots;

-- anon にはビューも公開しない
revoke all on public.calendar_entries from anon;
revoke all on public.map_entries from anon;
revoke all on public.search_entries from anon;
