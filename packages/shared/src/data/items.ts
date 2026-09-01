// 持ち物(ITM)のリポジトリ関数。
import type { RecodockClient } from '../supabase/client';
import { unwrap, unwrapVoid } from './errors';

export interface ItemRecord {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
  /** YYYY-MM-DD */
  purchasedOn: string | null;
  price: number | null;
  location: string | null;
  warrantyExpiresOn: string | null;
  memo: string | null;
}

export interface CreateItemInput {
  name: string;
  category?: string | null;
  tags?: readonly string[];
  purchasedOn?: string | null;
  price?: number | null;
  location?: string | null;
  warrantyExpiresOn?: string | null;
  memo?: string | null;
}

const COLUMNS =
  'id, name, category, tags, purchased_on, price, location, warranty_expires_on, memo';

interface ItemRow {
  id: string;
  name: string;
  category: string | null;
  tags: string[];
  purchased_on: string | null;
  price: number | null;
  location: string | null;
  warranty_expires_on: string | null;
  memo: string | null;
}

function toDomain(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tags: row.tags,
    purchasedOn: row.purchased_on,
    price: row.price === null ? null : Number(row.price),
    location: row.location,
    warrantyExpiresOn: row.warranty_expires_on,
    memo: row.memo,
  };
}

/** 持ち物一覧(ITM-50)。category を渡すとその分類だけ返す。 */
export async function list(client: RecodockClient, category?: string): Promise<ItemRecord[]> {
  let query = client.from('items').select(COLUMNS).order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  return unwrap(await query).map(toDomain);
}

/** 持ち物を登録する(ITM-51)。 */
export async function create(
  client: RecodockClient,
  userId: string,
  input: CreateItemInput,
): Promise<ItemRecord> {
  const result = await client
    .from('items')
    .insert({
      user_id: userId,
      name: input.name,
      category: input.category ?? null,
      tags: [...(input.tags ?? [])],
      purchased_on: input.purchasedOn ?? null,
      price: input.price ?? null,
      location: input.location ?? null,
      warranty_expires_on: input.warrantyExpiresOn ?? null,
      memo: input.memo ?? null,
    })
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 持ち物を削除する。 */
export async function remove(client: RecodockClient, itemId: string): Promise<void> {
  unwrapVoid(await client.from('items').delete().eq('id', itemId));
}
