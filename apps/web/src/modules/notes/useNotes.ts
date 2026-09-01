import { useMemo } from 'react';

/** MEM-60 の 1 件。 */
export interface Note {
  id: string;
  title: string;
  excerpt: string;
  /** リスト内表記: 08/18 */
  date: string;
  isPinned: boolean;
}

export interface NotesResult {
  pinnedNotes: readonly Note[];
  notes: readonly Note[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
}

// TODO: notes テーブルを引くリポジトリ関数＋TanStack Query に差し替える。
const SAMPLE_NOTES: readonly Note[] = [
  {
    id: 'n1',
    title: '鴨川で読む本リスト',
    excerpt: '・積読の消化 ・文庫を2冊持っていく',
    date: '08/18',
    isPinned: true,
  },
  {
    id: 'n2',
    title: '引越しチェックリスト',
    excerpt: '見積もり3社 ／ 退去連絡 ／ 転送届',
    date: '08/12',
    isPinned: true,
  },
  {
    id: 'n3',
    title: '読書メモ: 夜のピクニック',
    excerpt: '歩行祭の描写が良かった。散歩の記録と紐付けたい',
    date: '08/17',
    isPinned: false,
  },
  {
    id: 'n4',
    title: '買い物メモ',
    excerpt: '洗剤・コーヒー豆・電池',
    date: '08/15',
    isPinned: false,
  },
  {
    id: 'n5',
    title: '週次ふりかえり 8/10',
    excerpt: '散歩の習慣が定着してきた',
    date: '08/10',
    isPinned: false,
  },
  {
    id: 'n6',
    title: 'アプリのアイデア',
    excerpt: '記録の月次ダイジェストを自動生成する',
    date: '08/03',
    isPinned: false,
  },
];

/** メモ一覧を返す(MEM-60)。ピン留めと通常を分けて返す。 */
export function useNotes(): NotesResult {
  return useMemo(
    () => ({
      pinnedNotes: SAMPLE_NOTES.filter((note) => note.isPinned),
      notes: SAMPLE_NOTES.filter((note) => !note.isPinned),
      totalCount: SAMPLE_NOTES.length,
      isLoading: false,
      isError: false,
    }),
    [],
  );
}
