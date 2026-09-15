import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NoteRecord, UpsertNoteInput } from '@recodock/shared';
import { formatListDate, notesRepo, queryKeys } from '@recodock/shared';

import { supabase } from '../../lib/supabase';

/** MEM-60 の 1 件。 */
export interface Note {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  isPinned: boolean;
}

/** 一覧に出す抜粋の長さ。 */
const EXCERPT_LENGTH = 60;

function toNote(record: NoteRecord): Note {
  // 抜粋は素の文章として読ませたいので、行頭の Markdown 記法(見出し・箇条書き・チェックボックス)は落とす
  const body = record.body
    .split('\n')
    .map((line) => line.replace(/^\s*(?:#+|[-*])\s+(?:\[[ xX]\]\s+)?/, ''))
    .filter((line) => line.trim() !== '')
    .join(' ')
    .trim();
  return {
    id: record.id,
    title: record.title,
    excerpt: body.length > EXCERPT_LENGTH ? `${body.slice(0, EXCERPT_LENGTH)}…` : body,
    date: formatListDate(new Date(record.updatedAt)),
    isPinned: record.isPinned,
  };
}

export interface NotesResult {
  pinnedNotes: readonly Note[];
  notes: readonly Note[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
}

/** メモ一覧を返す(MEM-60)。ピン留めと通常を分けて返す。 */
export function useNotes(): NotesResult {
  const query = useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: () => notesRepo.list(supabase),
  });

  const all = (query.data ?? []).map(toNote);
  return {
    pinnedNotes: all.filter((note) => note.isPinned),
    notes: all.filter((note) => !note.isPinned),
    totalCount: all.length,
    isLoading: query.isPending,
    isError: query.isError,
  };
}

/** メモを作成する(MEM-61)。 */
export function useCreateNote(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<NoteRecord, Error, UpsertNoteInput>({
    mutationFn: (input) => {
      if (!userId) throw new Error('ログインが必要です');
      return notesRepo.create(supabase, userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: ['core'] });
    },
  });
}
