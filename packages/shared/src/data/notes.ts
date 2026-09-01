// メモ(MEM)のリポジトリ関数。
import type { RecodockClient } from '../supabase/client';
import { unwrap, unwrapVoid } from './errors';

export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  tags: string[];
  isPinned: boolean;
  /** ISO 8601 */
  updatedAt: string;
}

export interface UpsertNoteInput {
  title: string;
  body: string;
  tags?: readonly string[];
  isPinned?: boolean;
}

interface NoteRow {
  id: string;
  title: string;
  body: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
}

const COLUMNS = 'id, title, body, tags, is_pinned, updated_at';

function toDomain(row: NoteRow): NoteRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags,
    isPinned: row.is_pinned,
    updatedAt: row.updated_at,
  };
}

/** メモ一覧(MEM-60)。ピン留めを先頭に、その中で更新の新しい順。 */
export async function list(client: RecodockClient): Promise<NoteRecord[]> {
  const result = await client
    .from('notes')
    .select(COLUMNS)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  return unwrap(result).map(toDomain);
}

/** メモを作成する(MEM-61)。 */
export async function create(
  client: RecodockClient,
  userId: string,
  input: UpsertNoteInput,
): Promise<NoteRecord> {
  const result = await client
    .from('notes')
    .insert({
      user_id: userId,
      title: input.title,
      body: input.body,
      tags: [...(input.tags ?? [])],
      is_pinned: input.isPinned ?? false,
    })
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** メモを更新する(MEM-61)。 */
export async function update(
  client: RecodockClient,
  noteId: string,
  input: Partial<UpsertNoteInput>,
): Promise<NoteRecord> {
  const result = await client
    .from('notes')
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.tags !== undefined && { tags: [...input.tags] }),
      ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
    })
    .eq('id', noteId)
    .select(COLUMNS)
    .single();
  return toDomain(unwrap(result));
}

/** 1 件取得する(MEM-61)。 */
export async function get(client: RecodockClient, noteId: string): Promise<NoteRecord> {
  const result = await client.from('notes').select(COLUMNS).eq('id', noteId).single();
  return toDomain(unwrap(result));
}

/** ピン留めを切り替える(MEM-62)。 */
export async function setPinned(
  client: RecodockClient,
  noteId: string,
  isPinned: boolean,
): Promise<void> {
  unwrapVoid(await client.from('notes').update({ is_pinned: isPinned }).eq('id', noteId));
}

/** メモを削除する。 */
export async function remove(client: RecodockClient, noteId: string): Promise<void> {
  unwrapVoid(await client.from('notes').delete().eq('id', noteId));
}
