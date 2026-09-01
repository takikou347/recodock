// Storage(画像: FR-09)。バケットは private で、パス先頭 = アクセス判定キー(NFR-S4)。
// diary-photos / item-photos は user_id プレフィックス(05_security_rls.md 3.1)。
import type { RecodockClient } from '../supabase/client';
import { AppError, toAppError, unwrap, unwrapVoid } from './errors';

/** 署名 URL の有効期限(秒)。private バケットの配信は署名 URL で行う。 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** アップロード可能な画像バケット。 */
export type PhotoBucket = 'diary-photos' | 'item-photos';

export interface UploadedPhoto {
  /** Storage 上のパス(DB の storage_path / photo_path に保存する値) */
  path: string;
}

/** ファイル名から安全な拡張子だけを取り出す。 */
function extensionOf(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic)$/);
  return match?.[0] ?? '.jpg';
}

/**
 * 写真をアップロードする(FR-09)。パスは `<user_id>/<uuid><ext>` 規約。
 * File/Blob は Web・iOS の両方で使える形にしておく。
 */
export async function uploadPhoto(
  client: RecodockClient,
  bucket: PhotoBucket,
  userId: string,
  file: Blob & { name?: string },
): Promise<UploadedPhoto> {
  const path = `${userId}/${crypto.randomUUID()}${extensionOf(file.name ?? '')}`;
  const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw toAppError(error);
  return { path };
}

/** private バケットの画像に署名 URL を発行する(NFR-S4)。 */
export async function createSignedUrl(
  client: RecodockClient,
  bucket: PhotoBucket,
  path: string,
): Promise<string> {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw toAppError(error);
  if (!data?.signedUrl) throw new AppError('unknown', '処理に失敗しました');
  return data.signedUrl;
}

/** 日記写真のメタ行を追加する(DIA-02)。 */
export async function addDiaryPhoto(
  client: RecodockClient,
  userId: string,
  diaryId: string,
  storagePath: string,
  sortOrder: number,
): Promise<{ id: string }> {
  const result = await client
    .from('diary_photos')
    .insert({
      user_id: userId,
      diary_id: diaryId,
      storage_path: storagePath,
      sort_order: sortOrder,
    })
    .select('id')
    .single();
  return { id: unwrap(result).id };
}

/** 日記写真のメタ行を削除する。Storage 上の実体も消す。 */
export async function removeDiaryPhoto(
  client: RecodockClient,
  photoId: string,
  storagePath: string,
): Promise<void> {
  unwrapVoid(await client.from('diary_photos').delete().eq('id', photoId));
  const { error } = await client.storage.from('diary-photos').remove([storagePath]);
  if (error) throw toAppError(error);
}
