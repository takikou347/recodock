import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { DiaryMood, DiaryRecord, UpsertDiaryInput } from '@recodock/shared';
import {
  diariesRepo,
  formatFullDate,
  formatHeadingDate,
  formatListDate,
  queryKeys,
  spotsRepo,
  storageRepo,
} from '@recodock/shared';

import { supabase } from '@/lib/supabase';

/** 本文のブロック(DIA-42。text / heading / list / image / embed)。 */
export type DiaryBlock =
  | { id: string; kind: 'text'; text: string }
  | { id: string; kind: 'heading'; level: 1 | 2; text: string }
  | { id: string; kind: 'list'; items: readonly string[] }
  | {
      id: string;
      kind: 'image';
      /** 画像は asset_id 参照で保持する */
      assetId: string;
      fileName: string;
      align: ImageAlign;
      caption: string;
    };

/** 画像ブロックの配置(幅いっぱい / 中央小 / 回り込み)。 */
export type ImageAlign = 'full' | 'center' | 'wrap';

/** 気分タグの表示名。DB は CHECK 制約付きの英語キーで持つ。 */
const MOOD_LABELS: Readonly<Record<DiaryMood, string>> = {
  great: 'ごきげん',
  good: 'たのしい',
  normal: 'ふつう',
  bad: 'つかれた',
  awful: 'しずか',
};

export function moodLabel(mood: DiaryMood | null): string {
  return mood ? MOOD_LABELS[mood] : '記録なし';
}

/** DIA-40 一覧の 1 件。 */
export interface DiarySummary {
  id: string;
  date: string;
  headingDate: string;
  fullDate: string;
  mood: string;
  title: string;
  excerpt: string;
  photoCount: number;
  placeTag?: string;
  blocks: readonly DiaryBlock[];
}

/**
 * 本文(プレーンテキスト)をブロック配列に読み替える。
 * 段落の空行区切りを 1 ブロックとし、`# ` 始まりは見出し、`- ` 始まりは箇条書きにする。
 */
export function parseBlocks(body: string): DiaryBlock[] {
  const chunks = body.split(/\n{2,}/).filter((chunk) => chunk.trim().length > 0);
  if (chunks.length === 0) return [{ id: 'b-empty', kind: 'text', text: '' }];

  return chunks.map((chunk, index) => {
    const id = `b-${index}`;
    const trimmed = chunk.trim();
    const image = trimmed.match(/^!\[(.*)\]\(asset:([^?)]+)\?align=(full|center|wrap)\)$/);
    if (image) {
      return {
        id,
        kind: 'image',
        assetId: image[2] ?? '',
        fileName: '',
        align: (image[3] ?? 'full') as ImageAlign,
        caption: image[1] ?? '',
      };
    }
    if (trimmed.startsWith('## ')) {
      return { id, kind: 'heading', level: 2, text: trimmed.slice(3) };
    }
    if (trimmed.startsWith('# ')) {
      return { id, kind: 'heading', level: 1, text: trimmed.slice(2) };
    }
    if (trimmed.split('\n').every((line) => line.startsWith('- '))) {
      return { id, kind: 'list', items: trimmed.split('\n').map((line) => line.slice(2)) };
    }
    return { id, kind: 'text', text: trimmed };
  });
}

/** ブロック配列を保存用の本文に戻す。 */
export function serializeBlocks(blocks: readonly DiaryBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'text':
          return block.text;
        case 'heading':
          return `${block.level === 1 ? '#' : '##'} ${block.text}`;
        case 'list':
          return block.items.map((item) => `- ${item}`).join('\n');
        case 'image':
          return `![${block.caption}](asset:${block.assetId}?align=${block.align})`;
      }
    })
    .filter((chunk) => chunk.trim().length > 0)
    .join('\n\n');
}

/** 画像ブロックの保存記法(`![caption](asset:...)`)の行かどうか。 */
function isImageNotation(line: string): boolean {
  return /^!\[.*\]\(asset:[^)]+\)$/.test(line.trim());
}

/** 本文の1行目をタイトル、続きを抜粋・本文として扱う。 */
function splitTitle(body: string): { title: string; excerpt: string; rest: string } {
  const [first = '', ...rest] = body.split('\n');
  const title = first.replace(/^#+\s*/, '').trim() || '(無題)';
  // 抜粋は素の文章として読ませたいので、見出しの # と箇条書きの - は落とす
  const excerpt =
    rest
      .filter((line) => !isImageNotation(line))
      .map((line) => line.replace(/^\s*(#+|[-*])\s+/, ''))
      .join(' ')
      .trim() || title;
  return { title, excerpt, rest: rest.join('\n') };
}

/**
 * スポット名を id で引ける形で返す。
 * 日記が持つのは spot_id だけなので、地名を出すにはスポット側を引く必要がある。
 * キーは地図モジュールの一覧と同じにして、同じ取得結果を使い回す。
 */
function useSpotNames(): Readonly<Record<string, string>> {
  const query = useQuery({
    queryKey: queryKeys.map.spots('all'),
    queryFn: () => spotsRepo.list(supabase),
  });
  return useMemo(
    () => Object.fromEntries((query.data ?? []).map((spot) => [spot.id, spot.name])),
    [query.data],
  );
}

function toSummary(
  record: DiaryRecord,
  spotNames: Readonly<Record<string, string>> = {},
): DiarySummary {
  const date = new Date(`${record.entryDate}T00:00:00`);
  const { title, excerpt, rest } = splitTitle(record.body);
  // タイトル行は title として別管理するため、本文ブロックには含めない
  // (含めると編集のたびに body 先頭へタイトルが重複していく)
  const blocks = parseBlocks(rest);
  return {
    id: record.id,
    date: formatListDate(date),
    headingDate: formatHeadingDate(date),
    fullDate: formatFullDate(date),
    mood: moodLabel(record.mood),
    title,
    excerpt,
    // 本文の画像ブロックがそのまま写真の枚数。DB を追加で引かずに実データで出せる
    photoCount: blocks.filter((block) => block.kind === 'image').length,
    // 地名が引けないうち(未取得・スポット削除済み)は、代わりの文言を出さず何も出さない
    placeTag: record.spotId ? spotNames[record.spotId] : undefined,
    blocks,
  };
}

export interface DiariesResult {
  diaries: readonly DiarySummary[];
  isLoading: boolean;
  isError: boolean;
}

/** 日記一覧を返す(DIA-40)。keyword で本文を絞り込む。 */
export function useDiaries(keyword: string): DiariesResult {
  const spotNames = useSpotNames();
  const query = useQuery({
    queryKey: queryKeys.diary.list(keyword),
    queryFn: () => diariesRepo.list(supabase, keyword),
  });
  return {
    diaries: (query.data ?? []).map((record) => toSummary(record, spotNames)),
    isLoading: query.isPending,
    isError: query.isError,
  };
}

/** 1 件の日記を返す(DIA-41 / DIA-42)。 */
export function useDiary(diaryId: string | undefined): DiarySummary | undefined {
  const spotNames = useSpotNames();
  const query = useQuery({
    queryKey: queryKeys.diary.detail(diaryId ?? ''),
    queryFn: () => diariesRepo.get(supabase, diaryId ?? ''),
    enabled: Boolean(diaryId),
  });
  return query.data ? toSummary(query.data, spotNames) : undefined;
}

/** 日記を保存する(DIA-42 の自動保存)。 */
export function useSaveDiary() {
  const queryClient = useQueryClient();
  return useMutation<DiaryRecord, Error, { diaryId: string; input: Partial<UpsertDiaryInput> }>({
    mutationFn: ({ diaryId, input }) => diariesRepo.update(supabase, diaryId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['diary'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 日記を作成する。 */
export function useCreateDiary(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<DiaryRecord, Error, UpsertDiaryInput>({
    mutationFn: (input) => {
      if (!userId) throw new Error('ログインが必要です');
      return diariesRepo.create(supabase, userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['diary'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}

/** 「1年前の今日」の日記(DIA-04)。 */
export function useDiaryOneYearAgo(today: Date): DiarySummary | undefined {
  const spotNames = useSpotNames();
  const target = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const dateKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(
    target.getDate(),
  ).padStart(2, '0')}`;
  const query = useQuery({
    queryKey: queryKeys.diary.list(`one-year-ago-${dateKey}`),
    queryFn: () => diariesRepo.listByDate(supabase, dateKey),
  });
  const first = query.data?.[0];
  return first ? toSummary(first, spotNames) : undefined;
}

/**
 * 日記写真の署名 URL を asset_id で引ける形で返す(DIA-02 / NFR-S4)。
 * private バケットのため、表示のたびに署名 URL を発行する。
 */
export function useDiaryPhotoUrls(diaryId: string | undefined): Readonly<Record<string, string>> {
  const query = useQuery({
    queryKey: queryKeys.diary.photos(diaryId ?? ''),
    queryFn: async () => {
      const photos = await diariesRepo.listPhotos(supabase, diaryId ?? '');
      const entries = await Promise.all(
        photos.map(
          async (photo) =>
            [
              photo.id,
              await storageRepo.createSignedUrl(supabase, 'diary-photos', photo.storagePath),
            ] as const,
        ),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: Boolean(diaryId),
  });
  return query.data ?? {};
}

/** 日記を削除する(DIA-41)。 */
export function useDeleteDiary() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (diaryId) => diariesRepo.remove(supabase, diaryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['diary'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}
